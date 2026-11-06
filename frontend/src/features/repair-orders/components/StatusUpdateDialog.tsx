import { useState } from "react";

import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";

import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { AppDialog } from "@/components/AppDialog";
import { deliveryNotesApi } from "@/api/deliveryNotes";
import { UPDATABLE_STATUSES, STATUS_LABELS } from "../types";

import type { RepairOrderStatus } from "../types";

interface StatusUpdateDialogProps {
  open: boolean;
  currentStatus: RepairOrderStatus;
  repairOrderId?: number;
  onClose: () => void;
  onConfirm: (newStatus: RepairOrderStatus) => void;
}

export function StatusUpdateDialog({ open, currentStatus, repairOrderId, onClose, onConfirm }: StatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<RepairOrderStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // true = confirmed delivery note; false = no delivery note (or lookup failed) -> warn on delivery.
  const [hasDeliveryNote, setHasDeliveryNote] = useState<boolean | null>(null);

  const handleClose = () => {
    setSelectedStatus(null);
    setConfirmOpen(false);
    onClose();
  };

  const handleAccept = async () => {
    if (!selectedStatus) return;
    // Only look up the delivery note when delivering: that is the moment the user closes
    // the order and can no longer create or attach a delivery note to it.
    if (selectedStatus === "ENTREGADO" && repairOrderId != null) {
      try {
        await deliveryNotesApi.getByRepairOrderId(repairOrderId);
        setHasDeliveryNote(true);
      } catch {
        // A failed lookup warns (false warning is harmless; a silent "has delivery note" is not).
        setHasDeliveryNote(false);
      }
    } else {
      setHasDeliveryNote(null);
    }
    setConfirmOpen(true);
  };

  const deliveryWarning =
    selectedStatus === "ENTREGADO" && hasDeliveryNote === false
      ? " Esta orden de trabajo no tiene un remito asociado; una vez entregada, no se podrá crear ni asociar ningún remito a esta orden."
      : "";

  return (
    <>
      <AppDialog
        open={open}
        onClose={handleClose}
        title="Actualizar estado"
        icon={<PublishedWithChangesIcon sx={{ fontSize: "1.25rem" }} />}
        actions={
          <>
            <Button onClick={handleClose} color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              disabled={!selectedStatus || selectedStatus === currentStatus}
              onClick={handleAccept}
            >
              Aceptar
            </Button>
          </>
        }
      >
        <RadioGroup
          value={selectedStatus ?? ""}
          onChange={(e) => setSelectedStatus(e.target.value as RepairOrderStatus)}
        >
          {UPDATABLE_STATUSES.map((status) => (
            <FormControlLabel
              key={status}
              value={status}
              control={<Radio />}
              label={STATUS_LABELS[status]}
              disabled={status === currentStatus}
            />
          ))}
        </RadioGroup>
      </AppDialog>

      <AppConfirmDialog
        open={confirmOpen}
        title="Confirmar cambio de estado"
        message={`¿Está seguro de cambiar de "${STATUS_LABELS[currentStatus]}" a "${
          selectedStatus ? STATUS_LABELS[selectedStatus] : ""
        }"?${deliveryWarning}`}
        confirmLabel="Confirmar"
        onConfirm={() => {
          if (selectedStatus) onConfirm(selectedStatus);
          setConfirmOpen(false);
          handleClose();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
