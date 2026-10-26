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
import { UPDATABLE_STATUSES, STATUS_LABELS } from "../types";

import type { RepairOrderStatus } from "../types";

interface StatusUpdateDialogProps {
  open: boolean;
  currentStatus: RepairOrderStatus;
  onClose: () => void;
  onConfirm: (newStatus: RepairOrderStatus) => void;
}

export function StatusUpdateDialog({ open, currentStatus, onClose, onConfirm }: StatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<RepairOrderStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClose = () => {
    setSelectedStatus(null);
    setConfirmOpen(false);
    onClose();
  };

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
              onClick={() => setConfirmOpen(true)}
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
        }"?`}
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
