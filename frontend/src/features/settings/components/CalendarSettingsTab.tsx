import { useState, useEffect } from "react";

import {
  Alert,
  Box,
  Button,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useCalendarConfig } from "@/features/appointments/hooks/useCalendarConfig";
import { TagsManager } from "@/features/settings/components/TagsManager";

export function CalendarSettingsTab() {
  const { config, updateConfig } = useCalendarConfig();
  const [duration, setDuration] = useState<number>(60);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (config) setDuration(config.defaultAppointmentDurationMinutes);
  }, [config]);

  const handleSaveDuration = async () => {
    try {
      await updateConfig({
        defaultAppointmentDurationMinutes: duration,
        startTime: config?.startTime ?? null,
        endTime: config?.endTime ?? null,
      });
      setSnackbar({ open: true, message: "Duración actualizada", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Error al actualizar la duración", severity: "error" });
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
        <Button variant="contained" onClick={handleSaveDuration}>
          Guardar
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Etiquetas
      </Typography>
      <TagsManager />

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
