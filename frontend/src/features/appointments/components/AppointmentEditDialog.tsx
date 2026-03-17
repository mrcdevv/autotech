import { useState, useEffect } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import type { Dayjs } from "dayjs";
import type { AppointmentResponse, AppointmentUpdateRequest } from "@/types/appointment";

interface AppointmentEditDialogProps {
  open: boolean;
  appointment: AppointmentResponse | null;
  onClose: () => void;
  onSave: (id: number, data: AppointmentUpdateRequest) => Promise<void>;
}

export function AppointmentEditDialog({
  open,
  appointment,
  onClose,
  onSave,
}: AppointmentEditDialogProps) {
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment && open) {
      setStartTime(dayjs(appointment.startTime));
      setEndTime(dayjs(appointment.endTime));
    }
  }, [appointment, open]);

  const handleSave = async () => {
    if (!appointment || !startTime || !endTime) return;

    if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
      alert("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    setSaving(true);
    try {
      await onSave(appointment.id, {
        startTime: startTime.format("YYYY-MM-DDTHH:mm:ss"),
        endTime: endTime.format("YYYY-MM-DDTHH:mm:ss"),
      });
      onClose();
    } catch (error) {
      console.error("Error updating appointment:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Editar fecha y hora</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <DateTimePicker
              label="Fecha y hora de inicio"
              value={startTime}
              onChange={(newValue) => setStartTime(newValue)}
              disabled={saving}
            />
            <DateTimePicker
              label="Fecha y hora de fin"
              value={endTime}
              onChange={(newValue) => setEndTime(newValue)}
              disabled={saving}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !startTime || !endTime}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
