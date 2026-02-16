import { useState, useEffect } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import type { ProductResponse, ProductRequest } from "@/types/catalog";

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProductRequest) => Promise<void>;
  initialData?: ProductResponse | null;
}

interface FormErrors {
  [key: string]: string;
}

export function ProductFormDialog({ open, onClose, onSave, initialData }: ProductFormDialogProps) {
  const [form, setForm] = useState<ProductRequest>({ name: "", description: null, quantity: 0, unitPrice: null });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name,
          description: initialData.description,
          quantity: initialData.quantity,
          unitPrice: initialData.unitPrice,
        });
      } else {
        setForm({ name: "", description: null, quantity: 0, unitPrice: null });
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleChange = (field: keyof ProductRequest, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "El nombre del producto es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      await onSave(form);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? "Editar producto" : "Nuevo producto"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción"
                value={form.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value || null)}
                multiline
                rows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={form.quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("quantity", val === "" ? 0 : Math.max(0, parseInt(val)));
                }}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Precio unitario"
                type="number"
                value={form.unitPrice ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("unitPrice", val === "" ? null : parseFloat(val));
                }}
                slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
