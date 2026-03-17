import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import type { AppointmentResponse, AppointmentStatus } from "@/types/appointment";

interface AppointmentDetailDialogProps {
  open: boolean;
  appointment: AppointmentResponse | null;
  onClose: () => void;
  onEdit?: (appointment: AppointmentResponse) => void;
}

const DELIVERY_LABELS: Record<string, string> = {
  PROPIO: "Propio",
  GRUA: "Grúa",
  TERCERO: "Tercero",
};

const STATUS_LABELS: Record<AppointmentStatus, { label: string; color: string }> = {
  SCHEDULED: { label: "Programada", color: "primary" },
  CANCELLED: { label: "Cancelada", color: "error" },
  COMPLETED: { label: "Completada", color: "success" },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "Pendiente";
  return dayjs(iso).format("DD/MM/YYYY HH:mm");
}

export function AppointmentDetailDialog({ open, appointment, onClose, onEdit }: AppointmentDetailDialogProps) {
  if (!appointment) return null;

  const getDisplayStatus = () => {
    if (appointment.status === "COMPLETED") {
      return { label: "Completada", color: "success" as const };
    }
    if (appointment.status === "CANCELLED") {
      return { label: "Cancelada", color: "error" as const };
    }
    if (appointment.vehicleArrivedAt) {
      return { label: "En progreso", color: "info" as const };
    }
    return { label: "Programada", color: "primary" as const };
  };

  const displayStatus = getDisplayStatus();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{appointment.title ?? `Cita #${appointment.id}`}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
            <Chip
              label={displayStatus.label}
              color={displayStatus.color}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Fecha y hora</Typography>
            <Typography>
              {dayjs(appointment.startTime).format("DD/MM/YYYY HH:mm")} — {dayjs(appointment.startTime).isSame(dayjs(appointment.endTime), "day")
                ? dayjs(appointment.endTime).format("HH:mm")
                : dayjs(appointment.endTime).format("DD/MM/YYYY HH:mm")}
            </Typography>
          </Box>

          {appointment.clientFullName && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Cliente</Typography>
              <Typography>{appointment.clientFullName}</Typography>
            </Box>
          )}

          {appointment.vehiclePlate && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Vehículo</Typography>
              <Typography>
                {appointment.vehiclePlate}
                {appointment.vehicleBrand && ` — ${appointment.vehicleBrand}`}
                {appointment.vehicleModel && ` ${appointment.vehicleModel}`}
              </Typography>
            </Box>
          )}

          {appointment.purpose && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Propósito</Typography>
              <Typography>{appointment.purpose}</Typography>
            </Box>
          )}

          {appointment.tags.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Etiquetas</Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                {appointment.tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    sx={{ bgcolor: tag.color ?? undefined }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {appointment.employees.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Empleados</Typography>
              <Typography>
                {appointment.employees.map((e) => `${e.firstName} ${e.lastName}`).join(", ")}
              </Typography>
            </Box>
          )}

          {appointment.vehicleDeliveryMethod && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Método de entrega</Typography>
              <Typography>{DELIVERY_LABELS[appointment.vehicleDeliveryMethod] ?? appointment.vehicleDeliveryMethod}</Typography>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Vehículo recibido</Typography>
            <Typography>{formatDateTime(appointment.vehicleArrivedAt)}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Vehículo retirado</Typography>
            <Typography>{formatDateTime(appointment.vehiclePickedUpAt)}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        {onEdit && appointment.status !== "CANCELLED" && (
          <Button 
            variant="contained" 
            onClick={() => {
              onEdit(appointment);
              onClose();
            }}
          >
            Editar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
