import { useEffect, useState } from "react";

import { Alert, Box, Button, CircularProgress, Snackbar, TextField } from "@mui/material";

import { taxConfigApi } from "@/api/taxConfig";

const DEFAULT_HELPER_TEXT = "Porcentaje de IVA aplicado por defecto (0-100)";

// Keeps the raw input so an empty field is rejected instead of silently becoming 0
function validateTaxInput(raw: string): string | null {
  if (raw.trim() === "") return "Ingresá un porcentaje de IVA";
  const value = Number(raw);
  if (Number.isNaN(value) || value < 0 || value > 100) return "El IVA debe estar entre 0 y 100";
  return null;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

export function TaxSettings() {
  const [taxInput, setTaxInput] = useState("");
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
      .then((res) => setTaxInput(String(res.data.data.taxPercentage)))
      .catch(() => setError("Error al cargar la configuración de IVA"))
      .finally(() => setLoading(false));
  }, []);

  const validationError = validateTaxInput(taxInput);

  const handleSave = async () => {
    if (validationError) return;
    const taxPercentage = Number(taxInput);
    setSaving(true);
    setError(null);
    try {
      const res = await taxConfigApi.updateConfig({ taxPercentage });
      setTaxInput(String(res.data.data.taxPercentage));
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
          value={taxInput}
          onChange={(e) => setTaxInput(e.target.value)}
          inputProps={{ min: 0, max: 100 }}
          error={validationError != null}
          helperText={validationError ?? DEFAULT_HELPER_TEXT}
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || validationError != null}
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
