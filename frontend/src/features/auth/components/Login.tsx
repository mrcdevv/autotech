import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      login(response.data);
      if (response.data.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Credenciales inválidas o error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "background.default"
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", p: 2 }}>
        <CardContent>
          <Box component="img" src="/vite.svg" alt="Logo Autotech" sx={{ display: "block", mx: "auto", mb: 2, height: 60 }} />
          <Typography variant="h5" component="h1" textAlign="center" gutterBottom fontWeight="bold">
            Autotech
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
            Inicio de sesión administrativo
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Correo Electrónico"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 1 }}
            >
              {loading ? "Iniciando sesión..." : "Ingresar"}
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              display="block"
              sx={{ mt: 1 }}
            >
              ¿Olvidaste tu contraseña? Contactá al administrador del sistema
              para que la restablezca.
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
