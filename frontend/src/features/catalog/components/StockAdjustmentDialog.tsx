import { useState, useEffect } from "react";

import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";

import { AppDialog } from "@/components/AppDialog";

import type { ProductResponse, StockAdjustmentMode, StockAdjustmentRequest } from "@/types/catalog";

interface StockAdjustmentDialogProps {
  open: boolean;
  product: ProductResponse | null;
  onClose: () => void;
  onSave: (data: StockAdjustmentRequest) => Promise<void>;
}

const MODE_LABELS: Record<StockAdjustmentMode, string> = {
  INCREASE: "Ingreso (compra, devolución)",
  DECREASE: "Egreso (rotura, pérdida, uso interno)",
  SET: "Conteo físico (fijar cantidad)",
};

function resultingStock(onHand: number, mode: StockAdjustmentMode, quantity: number): number {
  if (mode === "INCREASE") return onHand + quantity;
  if (mode === "DECREASE") return onHand - quantity;
  return quantity;
}

export function StockAdjustmentDialog({ open, product, onClose, onSave }: StockAdjustmentDialogProps) {
  const [mode, setMode] = useState<StockAdjustmentMode>("INCREASE");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ quantity?: string; reason?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("INCREASE");
      setQuantity("");
      setReason("");
      setErrors({});
    }
  }, [open]);

  if (!product) return null;

  const parsedQuantity = quantity === "" ? null : Number(quantity);
  const preview = parsedQuantity == null ? null : resultingStock(product.quantity, mode, parsedQuantity);

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (parsedQuantity == null || Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      newErrors.quantity = "Ingresá una cantidad válida";
    } else if (mode !== "SET" && parsedQuantity === 0) {
      newErrors.quantity = "La cantidad debe ser mayor a 0";
    } else if (preview === product.quantity) {
      newErrors.quantity = "El ajuste no modifica el stock actual";
    }
    if (!reason.trim()) newErrors.reason = "El motivo es obligatorio";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || parsedQuantity == null) return;

    setSaving(true);
    try {
      await onSave({ mode, quantity: parsedQuantity, reason: reason.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Ajustar stock"
      subtitle={product.name}
      icon={<TuneIcon sx={{ fontSize: "1.25rem" }} />}
      actions={
        <>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>Guardar ajuste</Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          En stock: <strong>{product.quantity}</strong> · Reservado: <strong>{product.reservedQuantity}</strong> ·
          Disponible: <strong>{product.availableQuantity}</strong>
        </Typography>
        <TextField
          select
          label="Tipo de ajuste"
          value={mode}
          onChange={(e) => setMode(e.target.value as StockAdjustmentMode)}
          fullWidth
        >
          {(Object.keys(MODE_LABELS) as StockAdjustmentMode[]).map((key) => (
            <MenuItem key={key} value={key}>
              {MODE_LABELS[key]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={mode === "SET" ? "Cantidad contada" : "Cantidad"}
          type="number"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setErrors((prev) => ({ ...prev, quantity: undefined }));
          }}
          error={!!errors.quantity}
          helperText={errors.quantity}
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
          fullWidth
          required
        />
        <TextField
          label="Motivo"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setErrors((prev) => ({ ...prev, reason: undefined }));
          }}
          error={!!errors.reason}
          helperText={errors.reason ?? "Ej.: compra a proveedor, conteo mensual, repuesto dañado"}
          slotProps={{ htmlInput: { maxLength: 500 } }}
          fullWidth
          required
        />
        {preview != null && !Number.isNaN(preview) && (
          <Alert severity={preview < 0 ? "warning" : "info"}>
            El stock en mano quedará en {preview}.
          </Alert>
        )}
      </Stack>
    </AppDialog>
  );
}
