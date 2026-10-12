import { useState, useEffect } from "react";

import {
  Button,
  TextField,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import BuildIcon from "@mui/icons-material/Build";

import { AppDialog } from "@/components/AppDialog";
import { MoneyInput } from "@/components/MoneyInput";

import type { CatalogServiceResponse, CatalogServiceRequest } from "@/types/catalog";

interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CatalogServiceRequest) => Promise<void>;
  initialData?: CatalogServiceResponse | null;
}

interface FormErrors {
  [key: string]: string;
}

export function ServiceFormDialog({ open, onClose, onSave, initialData }: ServiceFormDialogProps) {
  const [form, setForm] = useState<Omit<CatalogServiceRequest, "price"> & { price: number | null }>({
    name: "",
    description: null,
    price: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name,
          description: initialData.description,
          price: initialData.price,
        });
      } else {
        setForm({ name: "", description: null, price: null });
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleChange = (field: keyof CatalogServiceRequest, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "El nombre del servicio es obligatorio";
    if (form.price === null || form.price === undefined) {
      newErrors.price = "El precio es obligatorio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      await onSave({
        ...form,
        price: Number(form.price),
      } as CatalogServiceRequest);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={initialData ? "Editar servicio" : "Nuevo servicio"}
      icon={<BuildIcon sx={{ fontSize: "1.25rem" }} />}
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
              placeholder="Ej: Cambio de aceite"
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
              placeholder="Ej: Cambio de aceite sintético 10W-40 y filtro de aceite"
              value={form.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value || null)}
              multiline
              rows={3}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <MoneyInput
              fullWidth
              label="Precio"
              placeholder="Ej: 5000.00"
              value={form.price}
              onChange={(v) => handleChange("price", v)}
              error={!!errors.price}
              helperText={errors.price}
              required
            />
          </Grid>
        </Grid>
      </Stack>
    </AppDialog>
  );
}
