import { useState, useEffect } from "react";

import {
  Button,
  TextField,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { AppDialog } from "@/components/AppDialog";

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

type ProductFormState = Omit<ProductRequest, "quantity" | "unitPrice"> & {
  quantity: number | string | null;
  unitPrice: number | string | null;
};

export function ProductFormDialog({ open, onClose, onSave, initialData }: ProductFormDialogProps) {
  const [form, setForm] = useState<ProductFormState>({
    name: "",
    description: null,
    quantity: 0,
    unitPrice: null,
  });
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
    if (form.quantity === "" || form.quantity === null || form.quantity === undefined) {
      newErrors.quantity = "La cantidad es obligatoria";
    }
    if (form.unitPrice === "" || form.unitPrice === null || form.unitPrice === undefined) {
      newErrors.unitPrice = "El precio unitario es obligatorio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      await onSave({
        ...form,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
      } as ProductRequest);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={initialData ? "Editar producto" : "Nuevo producto"}
      icon={<Inventory2Icon sx={{ fontSize: "1.25rem" }} />}
      actions={
        <>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 0.5 }}>
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
              value={form.quantity ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                handleChange("quantity", val === "" ? null : Math.max(0, parseInt(val)));
              }}
              error={!!errors.quantity}
              helperText={errors.quantity}
              required
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
                handleChange("unitPrice", val === "" ? "" : parseFloat(val));
              }}
              error={!!errors.unitPrice}
              helperText={errors.unitPrice}
              required
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            />
          </Grid>
        </Grid>
      </Stack>
    </AppDialog>
  );
}
