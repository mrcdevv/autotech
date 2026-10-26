import { useState, useEffect } from "react";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import {
  Alert,
  Box,
  Button,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import { useCalendarConfig } from "@/features/appointments/hooks/useCalendarConfig";

import type { Dayjs } from "dayjs";

// Required to parse "HH:mm" strings with dayjs(value, "HH:mm").
dayjs.extend(customParseFormat);

const toDayjs = (value: string | null): Dayjs | null =>
  value ? dayjs(value, "HH:mm") : null;

const toTimeString = (value: Dayjs | null): string | null =>
  value ? value.format("HH:mm") : null;

export function CalendarSettingsTab() {
  const { config, updateConfig } = useCalendarConfig();
  const [duration, setDuration] = useState<number>(60);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Depend on primitive config values so the effect does not loop when the
  // hook returns a new config object reference on every render.
  const configDuration = config?.defaultAppointmentDurationMinutes ?? 60;
  const configStartTime = config?.startTime ?? null;
  const configEndTime = config?.endTime ?? null;

  useEffect(() => {
    setDuration(configDuration);
    setStartTime(toDayjs(configStartTime));
    setEndTime(toDayjs(configEndTime));
  }, [configDuration, configStartTime, configEndTime]);

  const handleSave = async () => {
    try {
      await updateConfig({
        defaultAppointmentDurationMinutes: duration,
        startTime: toTimeString(startTime),
        endTime: toTimeString(endTime),
      });
      setSnackbar({ open: true, message: "Configuración actualizada", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Error al actualizar la configuración", severity: "error" });
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Duración de citas por defecto
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <TextField
          label="Duración (minutos)"
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          slotProps={{ htmlInput: { min: 1 } }}
          sx={{ width: 200 }}
        />
      </Stack>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Horario comercial
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TimePicker
            label="Horario de inicio"
            value={startTime}
            onChange={setStartTime}
            ampm={false}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TimePicker
            label="Horario de fin"
            value={endTime}
            onChange={setEndTime}
            ampm={false}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" onClick={handleSave}>
          Guardar
        </Button>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
