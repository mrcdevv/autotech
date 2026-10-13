import { useEffect, useState } from "react";

import { Alert, Box, Button, CircularProgress, Snackbar, TextField } from "@mui/material";

import { taxConfigApi } from "@/api/taxConfig";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

export function TaxSettings() {
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    taxConfigApi
      .getConfig()
      .then((res) => setTaxPercentage(res.data.data.taxPercentage))
      .catch(() => setError("Error al cargar la configuración de IVA"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (taxPercentage < 0 || taxPercentage > 100) return;
    setSaving(true);
    setError(null);
    try {
      const res = await taxConfigApi.updateConfig({ taxPercentage });
      setTaxPercentage(res.data.data.taxPercentage);
      setSnackbar({ open: true, message: "Configuración de IVA guardada", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Error al guardar la configuración de IVA", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <TextField
          label="IVA por defecto (%)"
          type="number"
          value={taxPercentage}
          onChange={(e) => setTaxPercentage(Number(e.target.value))}
          inputProps={{ min: 0, max: 100 }}
          helperText="Porcentaje de IVA aplicado por defecto (0-100)"
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || taxPercentage < 0 || taxPercentage > 100}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
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
    </>
  );
}
