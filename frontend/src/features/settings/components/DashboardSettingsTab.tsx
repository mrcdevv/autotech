import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { dashboardApi } from "@/api/dashboard";

export function DashboardSettingsTab() {
  const [threshold, setThreshold] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dashboardApi
      .getConfig()
      .then((res) => setThreshold(res.data.data.staleThresholdDays))
      .catch(() => setError("Error al cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (threshold < 1 || threshold > 90) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await dashboardApi.updateConfig({ staleThresholdDays: threshold });
      setThreshold(res.data.data.staleThresholdDays);
      setSuccess(true);
    } catch {
      setError("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Configuración del Dashboard
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Configuración guardada</Alert>}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <TextField
            label="Días de inactividad para alerta"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            inputProps={{ min: 1, max: 90 }}
            helperText="Órdenes y presupuestos sin cambios por más de estos días generarán alertas (1-90)"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || threshold < 1 || threshold > 90}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
