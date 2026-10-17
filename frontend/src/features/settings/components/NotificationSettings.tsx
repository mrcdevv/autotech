import { useEffect, useState } from "react";

import { Alert, Box, Button, CircularProgress, FormControlLabel, Snackbar, Switch, Typography } from "@mui/material";

import { notificationsApi } from "@/api/notifications";
import { ReminderRow } from "@/features/settings/components/ReminderRow";
import { NOTIFICATION_LIMITS as LIMITS, describeRemindersCron, isNotificationConfigValid } from "@/features/settings/notificationConfig";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

import type { NotificationConfigRequest, NotificationConfigResponse } from "@/types/notification";

export function NotificationSettings() {
  const [config, setConfig] = useState<NotificationConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  useEffect(() => {
    notificationsApi
      .getConfig()
      .then((res) => setConfig(res.data.data))
      .catch(() => setError("Error al cargar la configuración de notificaciones"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (!config) return <Alert severity="error">{error}</Alert>;

  const update = (changes: Partial<NotificationConfigRequest>) => setConfig({ ...config, ...changes });
  const { mailEnabled, remindersCron, ...request } = config;
  const valid = isNotificationConfigValid(request);
  const rowsDisabled = !config.remindersEnabled || saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await notificationsApi.updateConfig(request);
      setConfig(res.data.data);
      setSnackbar({ message: "Configuración de notificaciones guardada", severity: "success" });
    } catch (err: unknown) {
      setSnackbar({ message: apiErrorMessage(err, "Error al guardar la configuración"), severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {!mailEnabled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          El envío de emails está deshabilitado en el servidor (AUTOTECH_MAIL_ENABLED). No se envía ningún email.
        </Alert>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={config.remindersEnabled}
            onChange={(e) => update({ remindersEnabled: e.target.checked })}
            disabled={saving}
          />
        }
        label="Enviar recordatorios automáticos"
      />
      <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mb: 1 }}>
        Se envían {describeRemindersCron(remindersCron)}. Cada recordatorio se manda una sola vez.
      </Typography>

      <ReminderRow
        label="Turno del día siguiente"
        description="Recuerda al cliente su turno de mañana (con opción de confirmar o avisar que no puede)."
        enabled={config.appointmentReminderEnabled}
        onEnabledChange={(v) => update({ appointmentReminderEnabled: v })}
        disabled={rowsDisabled}
      />
      <ReminderRow
        label="Service periódico"
        description="Invita a volver cuando pasó cierto tiempo desde la última orden entregada del vehículo."
        enabled={config.serviceReminderEnabled}
        onEnabledChange={(v) => update({ serviceReminderEnabled: v })}
        disabled={rowsDisabled}
        threshold={{
          label: "Meses desde la entrega",
          value: config.serviceReminderMonths,
          ...LIMITS.serviceReminderMonths,
          onChange: (v) => update({ serviceReminderMonths: v }),
        }}
      />
      <ReminderRow
        label="Saldo pendiente"
        description="Avisa cuando un remito sigue con saldo a pagar (adjunta el remito en PDF)."
        enabled={config.balanceDueEnabled}
        onEnabledChange={(v) => update({ balanceDueEnabled: v })}
        disabled={rowsDisabled}
        threshold={{
          label: "Días desde la emisión",
          value: config.balanceDueDays,
          ...LIMITS.balanceDueDays,
          onChange: (v) => update({ balanceDueDays: v }),
        }}
      />
      <ReminderRow
        label="Vehículo sin retirar"
        description="Avisa cuando el vehículo está listo y el cliente todavía no lo retiró."
        enabled={config.pickupReminderEnabled}
        onEnabledChange={(v) => update({ pickupReminderEnabled: v })}
        disabled={rowsDisabled}
        threshold={{
          label: "Días desde que está listo",
          value: config.pickupReminderDays,
          ...LIMITS.pickupReminderDays,
          onChange: (v) => update({ pickupReminderDays: v }),
        }}
      />

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving || !valid}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </Box>

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity ?? "success"} variant="filled">
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
