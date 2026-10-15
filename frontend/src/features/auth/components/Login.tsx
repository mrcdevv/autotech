import { useState } from "react";
import { useNavigate } from "react-router";
import { isAxiosError } from "axios";

import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Visibility, VisibilityOff, Handyman } from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";
import loginWorkshop from "@/assets/login-workshop.jpg";
import { border } from "@/theme/tokens";

function getLoginErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Credenciales inválidas o error en el servidor.";
  }

  return "Credenciales inválidas o error en el servidor.";
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa ambos campos.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      login(response.data, remember);
      if (response.data.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100dvh", display: "flex", overflow: "hidden", bgcolor: "background.paper" }}>
      <Box
        sx={{
          width: { xs: "100%", md: "52%" },
          minWidth: { md: 480 },
          maxWidth: { md: 740 },
          display: "flex",
          flexDirection: "column",
          px: { xs: 3, sm: 6, md: 7 },
          py: { xs: 3, md: 4 },
          borderRight: { md: `1px solid ${border.base}` },
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            py: 2,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 460, mx: "auto" }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ justifyContent: "center", mb: 3 }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  boxShadow: "0 6px 16px rgba(255, 122, 26, 0.35)",
                }}
              >
                <Handyman sx={{ fontSize: 30 }} />
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                Autotech
              </Typography>
            </Stack>

            <Typography variant="h3" component="h1" sx={{ mb: 0.5 }}>
              Iniciar sesión
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              ¿No tenés acceso?{" "}
              <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
                Contactá al administrador
              </Box>
              .
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Correo electrónico"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <TextField
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Recordarme</Typography>}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Ingresar"}
                </Button>
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{ mt: 2.5 }}
              >
                ¿Olvidaste tu contraseña?{" "}
                <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
                  Contactá al administrador
                </Box>
              </Typography>
            </form>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" textAlign="center">
          © 2026 Autotech · Sistema de gestión para taller mecánico
        </Typography>
      </Box>

      <Box
        sx={{
          display: { xs: "none", md: "block" },
          flex: 1,
          position: "relative",
          overflow: "hidden",
          bgcolor: "#131418",
        }}
      >
        <Box
          component="img"
          src={loginWorkshop}
          alt="Mecánico trabajando en un vehículo elevado dentro del taller"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,11,14,0.35) 0%, rgba(10,11,14,0) 35%, rgba(10,11,14,0.85) 100%)",
          }}
        />
        <Box sx={{ position: "absolute", left: 48, right: 48, bottom: 48 }}>
          <Typography variant="h2" sx={{ color: "#fff", mb: 1 }}>
            Gestioná tu taller con precisión
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
            Órdenes de reparación, presupuestos, inspecciones y remitos en un solo lugar.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
