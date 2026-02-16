import { Box, Chip, Paper, Typography } from "@mui/material";

import { AppointmentActions } from "./AppointmentActions";

import type { AppointmentResponse } from "@/types/appointment";

interface AppointmentCardProps {
  appointment: AppointmentResponse;
  onClick: (appointment: AppointmentResponse) => void;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

export function AppointmentCard({
  appointment,
  onClick,
  onMarkClientArrived,
  onMarkVehicleArrived,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  return (
    <Paper
      sx={{
        p: 0.5,
        cursor: "pointer",
        borderLeft: 3,
        borderColor: appointment.tags[0]?.color ?? "primary.main",
      }}
      onClick={() => onClick(appointment)}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" fontWeight="bold" noWrap>
            {appointment.title ?? `Cita #${appointment.id}`}
          </Typography>
          {appointment.clientFullName && (
            <Typography variant="caption" display="block" color="text.secondary" noWrap>
              {appointment.clientFullName}
            </Typography>
          )}
          {appointment.vehiclePlate && (
            <Typography variant="caption" display="block" color="text.secondary" noWrap>
              {appointment.vehiclePlate}
            </Typography>
          )}
        </Box>
        <AppointmentActions
          appointment={appointment}
          onMarkClientArrived={onMarkClientArrived}
          onMarkVehicleArrived={onMarkVehicleArrived}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </Box>
      {appointment.clientArrived && (
        <Chip label="Cliente presente" size="small" color="success" sx={{ mt: 0.5 }} />
      )}
    </Paper>
  );
}
