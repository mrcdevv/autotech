import { useState, useEffect } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid2";

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
  const [form, setForm] = useState<CatalogServiceRequest>({ name: "", description: null, price: null });
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
      <DialogTitle>{initialData ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
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
              <TextField
                fullWidth
                label="Precio"
                placeholder="Ej: 5000.00"
                type="number"
                value={form.price ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("price", val === "" ? null : parseFloat(val));
                }}
                slotProps={{
                  htmlInput: { min: 0, step: "0.01" },
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
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
