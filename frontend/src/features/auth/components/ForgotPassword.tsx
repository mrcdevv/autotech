import { useState } from "react";
import { Link as RouterLink } from "react-router";

import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";

import { authApi } from "../api/authApi";
import { AuthCard } from "./AuthCard";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Ingresá tu correo electrónico.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.requestPasswordRecovery(email.trim());
      setSentMessage(
        response.data.message ??
          "Si el email corresponde a una cuenta activa, te enviamos un enlace para restablecer la contraseña",
      );
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "No pudimos procesar el pedido. Intentá de nuevo más tarde."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard subtitle="Recuperar contraseña">
      {sentMessage ? (
        <Stack spacing={2}>
          <Alert severity="success">{sentMessage}</Alert>
          <Typography variant="body2" color="text.secondary">
            Revisá tu bandeja de entrada (y la carpeta de spam). El enlace vence en 30 minutos.
          </Typography>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Ingresá el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </Stack>
        </form>
      )}
      <Typography variant="body2" textAlign="center" sx={{ mt: 3 }}>
        <Link component={RouterLink} to="/login">
          Volver al inicio de sesión
        </Link>
      </Typography>
    </AuthCard>
  );
}
