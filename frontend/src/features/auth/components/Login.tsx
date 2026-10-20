import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import { isAxiosError } from "axios";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { Handyman, Visibility, VisibilityOff } from "@mui/icons-material";

import loginHero from "@/assets/login-hero.png";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";

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
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#FFFFFF" }}>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "64%",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundImage: `url(${loginHero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRight: "1px solid #E4E7EA",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: { md: 5, lg: 8 }, pb: { md: 6, lg: 7 }, maxWidth: 760 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { md: "1.65rem", lg: "1.9rem" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              color: "text.primary",
              mb: 1,
            }}
          >
            Gestioná tu taller con precisión
          </Typography>
          <Typography sx={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "text.secondary" }}>
            Órdenes de reparación, presupuestos, inspecciones y remitos en un solo lugar.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          bgcolor: "#FFFFFF",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 3, sm: 5 },
            py: 4,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 372 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(145deg, #FFA24D 0%, #FF6A00 100%)",
                  boxShadow: "0 6px 14px rgba(255, 122, 26, 0.28)",
                  color: "#1D1F24",
                }}
              >
                <Handyman sx={{ fontSize: 24 }} />
              </Box>
              <Typography sx={{ fontSize: "1.3125rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Autotech
              </Typography>
            </Stack>

            <Typography sx={{ fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.02em", mb: 0.5 }}>
              Iniciar sesión
            </Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 3 }}>
              ¿No tenés acceso?{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                Contactá al administrador.
              </Box>
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  type="email"
                  fullWidth
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  required
                  slotProps={{ htmlInput: { "aria-label": "Correo electrónico" } }}
                />
                <TextField
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  slotProps={{
                    htmlInput: { "aria-label": "Contraseña" },
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
                      )
                    }
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
                  label="Recordarme"
                  slotProps={{ typography: { fontSize: "0.8125rem", color: "text.secondary" } }}
                  sx={{ mx: 0, mt: 0.5 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.1, fontSize: "0.875rem" }}
                >
                  {loading ? "Iniciando sesión..." : "Ingresar"}
                </Button>
              </Stack>
            </form>

            <Typography sx={{ mt: 2.5, fontSize: "0.8125rem", color: "text.secondary" }}>
              <Link
                component={RouterLink}
                to="/recuperar-contrasena"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                Contactá al administrador
              </Box>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 3, sm: 5 }, pb: 3, display: "flex", justifyContent: "center" }}>
          <Typography sx={{ width: "100%", maxWidth: 372, fontSize: "0.75rem", color: "text.secondary" }}>
            © {new Date().getFullYear()} Autotech · Sistema de gestión para taller mecánico.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
