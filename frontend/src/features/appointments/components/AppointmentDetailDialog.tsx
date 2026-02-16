import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import type { AppointmentResponse } from "@/types/appointment";

interface AppointmentDetailDialogProps {
  open: boolean;
  appointment: AppointmentResponse | null;
  onClose: () => void;
}

const DELIVERY_LABELS: Record<string, string> = {
  PROPIO: "Propio",
  GRUA: "Grúa",
  TERCERO: "Tercero",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "Pendiente";
  return dayjs(iso).format("DD/MM/YYYY HH:mm");
}

export function AppointmentDetailDialog({ open, appointment, onClose }: AppointmentDetailDialogProps) {
  if (!appointment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{appointment.title ?? `Cita #${appointment.id}`}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
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

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Cliente presente</Typography>
            <Typography>{appointment.clientArrived ? "Sí" : "No"}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
