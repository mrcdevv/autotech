import { useState, useEffect } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Chip,
  Box,
  OutlinedInput,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { rolesApi } from "@/api/roles";
import type { RoleResponse } from "@/types/role";
import type { EmployeeResponse, EmployeeRequest, EmployeeStatus } from "@/features/employees/types";

interface EmployeeFormProps {
  open: boolean;
  employee: EmployeeResponse | null;
  onClose: () => void;
  onSave: (data: EmployeeRequest) => void;
}

interface FormErrors {
  [key: string]: string;
}

const INITIAL_FORM: EmployeeRequest = {
  firstName: "",
  lastName: "",
  dni: "",
  email: null,
  phone: "",
  address: null,
  province: null,
  country: null,
  maritalStatus: null,
  childrenCount: 0,
  entryDate: null,
  status: "ACTIVO",
  roleIds: [],
};

export function EmployeeForm({ open, employee, onClose, onSave }: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeRequest>(INITIAL_FORM);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      rolesApi.getAll().then((res) => setRoles(res.data.data)).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName,
        lastName: employee.lastName,
        dni: employee.dni,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        province: employee.province,
        country: employee.country,
        maritalStatus: employee.maritalStatus,
        childrenCount: employee.childrenCount,
        entryDate: employee.entryDate,
        status: employee.status,
        roleIds: employee.roles.map((r) => r.id),
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
  }, [employee, open]);

  const handleChange = (field: keyof EmployeeRequest, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = "El nombre es obligatorio";
    if (!form.lastName.trim()) newErrors.lastName = "El apellido es obligatorio";
    if (!form.dni.trim()) newErrors.dni = "El DNI es obligatorio";
    if (!form.phone.trim()) newErrors.phone = "El teléfono es obligatorio";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "El formato del correo electrónico no es válido";
    }
    if (form.roleIds.length === 0) newErrors.roleIds = "Debe asignar al menos un rol";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(form);
    }
  };

  const isEditing = employee !== null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Apellido"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="DNI"
                value={form.dni}
                onChange={(e) => handleChange("dni", e.target.value)}
                error={!!errors.dni}
                helperText={errors.dni}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => handleChange("email", e.target.value || null)}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Teléfono"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Dirección"
                value={form.address ?? ""}
                onChange={(e) => handleChange("address", e.target.value || null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Provincia"
                value={form.province ?? ""}
                onChange={(e) => handleChange("province", e.target.value || null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="País"
                value={form.country ?? ""}
                onChange={(e) => handleChange("country", e.target.value || null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Estado Civil"
                value={form.maritalStatus ?? ""}
                onChange={(e) => handleChange("maritalStatus", e.target.value || null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Cantidad de Hijos"
                type="number"
                value={form.childrenCount}
                onChange={(e) =>
                  handleChange("childrenCount", Math.max(0, parseInt(e.target.value) || 0))
                }
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Fecha de Entrada"
                value={form.entryDate ? dayjs(form.entryDate) : null}
                onChange={(date) =>
                  handleChange("entryDate", date ? date.format("YYYY-MM-DD") : null)
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={form.status}
                  label="Estado"
                  onChange={(e) => handleChange("status", e.target.value as EmployeeStatus)}
                >
                  <MenuItem value="ACTIVO">Activo</MenuItem>
                  <MenuItem value="INACTIVO">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth error={!!errors.roleIds} required>
                <InputLabel>Cargo / Rol</InputLabel>
                <Select
                  multiple
                  value={form.roleIds}
                  onChange={(e) => handleChange("roleIds", e.target.value as number[])}
                  input={<OutlinedInput label="Cargo / Rol" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {(selected as number[]).map((id) => {
                        const role = roles.find((r) => r.id === id);
                        return <Chip key={id} label={role?.name ?? id} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.roleIds && <FormHelperText>{errors.roleIds}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
