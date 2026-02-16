import { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";

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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Actualizar estado</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!selectedStatus || selectedStatus === currentStatus}
            onClick={() => setConfirmOpen(true)}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar cambio de estado</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de cambiar de &quot;{STATUS_LABELS[currentStatus]}&quot; a &quot;
            {selectedStatus ? STATUS_LABELS[selectedStatus] : ""}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (selectedStatus) onConfirm(selectedStatus);
              setConfirmOpen(false);
              handleClose();
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
