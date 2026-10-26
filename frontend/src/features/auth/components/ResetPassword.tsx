import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router";

import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";

import { authApi } from "../api/authApi";
import { AuthCard } from "./AuthCard";
import { validateNewPassword } from "@/features/auth/passwordValidation";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

import type { PasswordFormErrors } from "@/features/auth/passwordValidation";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateNewPassword(newPassword, confirmPassword);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setServerError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setDone(true);
    } catch (err: unknown) {
      setServerError(apiErrorMessage(err, "No pudimos restablecer la contraseña. Pedí un enlace nuevo."));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard subtitle="Restablecer contraseña">
        <Alert severity="error">El enlace es inválido. Pedí uno nuevo desde la pantalla de inicio de sesión.</Alert>
        <Typography variant="body2" textAlign="center" sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/recuperar-contrasena">
            Pedir un enlace nuevo
          </Link>
        </Typography>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitle="Restablecer contraseña">
      {done ? (
        <Stack spacing={2.5}>
          <Alert severity="success">Listo, tu contraseña fue actualizada.</Alert>
          <Button component={RouterLink} to="/login" variant="contained" size="large" fullWidth>
            Iniciar sesión
          </Button>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {serverError && (
              <Alert severity="error">
                {serverError}{" "}
                <Link component={RouterLink} to="/recuperar-contrasena">
                  Pedir un enlace nuevo
                </Link>
              </Alert>
            )}
            <TextField
              label="Contraseña nueva"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!errors.newPassword}
              helperText={errors.newPassword ?? "Mínimo 6 caracteres"}
              autoFocus
            />
            <TextField
              label="Repetir contraseña"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
            />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </Stack>
        </form>
      )}
    </AuthCard>
  );
}
