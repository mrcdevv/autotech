import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import type { EmployeeResponse } from "@/features/employees/types";

interface EmployeeDetailProps {
  open: boolean;
  employee: EmployeeResponse | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value || "-"}</Typography>
    </Grid>
  );
}

export function EmployeeDetail({ open, employee, onClose }: EmployeeDetailProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle del Empleado</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Field label="Nombre" value={employee.firstName} />
          <Field label="Apellido" value={employee.lastName} />
          <Field label="DNI" value={employee.dni} />
          <Field label="Correo Electrónico" value={employee.email} />
          <Field label="Teléfono" value={employee.phone} />
          <Field label="Dirección" value={employee.address} />
          <Field label="Provincia" value={employee.province} />
          <Field label="Ciudad" value={employee.city} />
          <Field label="País" value={employee.country} />
          <Field label="Estado Civil" value={employee.maritalStatus} />
          <Field label="Cantidad de Hijos" value={String(employee.childrenCount)} />
          <Field label="Fecha de Entrada" value={employee.entryDate} />
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Estado
            </Typography>
            <Stack direction="row" sx={{ mt: 0.5 }}>
              <Chip
                label={employee.status === "ACTIVO" ? "Activo" : "Inactivo"}
                color={employee.status === "ACTIVO" ? "success" : "error"}
                size="small"
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Roles
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              {employee.roles.map((role) => (
                <Chip key={role.id} label={role.name} size="small" variant="outlined" />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
