import { useState } from "react";

import { Alert, Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";

import { notificationsApi } from "@/api/notifications";
import { useAuth } from "@/features/auth/context/AuthContext";
import { formatReminderRun } from "@/features/settings/notificationConfig";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

interface ResultState {
  severity: "success" | "error" | "info";
  message: string;
}

/** Test email and manual run of the reminders job (useful for demos and to verify the SMTP setup). */
export function NotificationActions() {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState(user?.email ?? "");
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<ResultState | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<ResultState | null>(null);
  const [runDetail, setRunDetail] = useState<string[]>([]);

  const handleSendTest = async () => {
    setSending(true);
    setTestResult(null);
    try {
      const res = await notificationsApi.sendTestEmail(testEmail.trim());
      setTestResult({ severity: "success", message: res.data.message ?? "Email de prueba enviado" });
    } catch (err: unknown) {
      setTestResult({ severity: "error", message: apiErrorMessage(err, "No se pudo enviar el email de prueba") });
    } finally {
      setSending(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    setRunDetail([]);
    try {
      const res = await notificationsApi.runReminders();
      setRunResult({ severity: "success", message: res.data.message ?? "Recordatorios ejecutados" });
      setRunDetail(formatReminderRun(res.data.data));
    } catch (err: unknown) {
      setRunResult({ severity: "error", message: apiErrorMessage(err, "No se pudieron ejecutar los recordatorios") });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Email de prueba
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
          <TextField
            label="Enviar a"
            type="email"
            size="small"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            sx={{ minWidth: 260 }}
          />
          <Button variant="outlined" onClick={handleSendTest} disabled={sending || !testEmail.trim()}>
            {sending ? "Enviando..." : "Enviar email de prueba"}
          </Button>
        </Stack>
        {testResult && (
          <Alert severity={testResult.severity} sx={{ mt: 1.5 }}>
            {testResult.message}
          </Alert>
        )}
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Recordatorios
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Ejecuta ahora el envío diario. Solo se envían los recordatorios que todavía no se mandaron.
        </Typography>
        <Button variant="outlined" onClick={handleRun} disabled={running}>
          {running ? "Ejecutando..." : "Ejecutar recordatorios ahora"}
        </Button>
        {runResult && (
          <Alert severity={runResult.severity} sx={{ mt: 1.5 }}>
            {runResult.message}
            {runDetail.length > 0 && (
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                {runDetail.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </Box>
            )}
          </Alert>
        )}
      </Box>
    </Stack>
  );
}
