import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import dayjs from "dayjs";

import { AppointmentActions } from "./AppointmentActions";

import type { AppointmentResponse } from "@/types/appointment";

interface AppointmentCardProps {
  appointment: AppointmentResponse;
  compact?: boolean;
  onClick: (appointment: AppointmentResponse) => void;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

export function AppointmentCard({
  appointment,
  compact = false,
  onClick,
  onMarkClientArrived,
  onMarkVehicleArrived,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const tagColor = appointment.tags[0]?.color ?? "#1976d2";
  const timeLabel = `${dayjs(appointment.startTime).format("HH:mm")} - ${dayjs(appointment.endTime).format("HH:mm")}`;

  return (
    <Box
      sx={{
        px: 1,
        py: compact ? 0.25 : 0.5,
        cursor: "pointer",
        borderRadius: 1,
        bgcolor: alpha(tagColor, 0.12),
        borderLeft: 3,
        borderColor: tagColor,
        transition: "box-shadow 0.15s, background-color 0.15s",
        "&:hover": {
          boxShadow: 1,
          bgcolor: alpha(tagColor, 0.2),
        },
        overflow: "hidden",
        height: "100%",
      }}
      onClick={() => onClick(appointment)}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: tagColor, lineHeight: 1.3 }}
            noWrap
          >
            {compact ? timeLabel : (appointment.title ?? `Cita #${appointment.id}`)}
          </Typography>
          {!compact && (
            <Typography variant="caption" display="block" sx={{ color: "text.secondary", fontSize: "0.68rem" }} noWrap>
              {timeLabel}
            </Typography>
          )}
          {!compact && appointment.clientFullName && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mt: 0.25 }}>
              {appointment.clientArrived && (
                <PersonIcon sx={{ fontSize: 12, color: "success.main" }} />
              )}
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }} noWrap>
                {appointment.clientFullName}
              </Typography>
            </Box>
          )}
          {!compact && appointment.vehiclePlate && (
            <Typography variant="caption" display="block" sx={{ color: "text.secondary", fontSize: "0.68rem" }} noWrap>
              {appointment.vehiclePlate}
            </Typography>
          )}
        </Box>
        {!compact && (
          <AppointmentActions
            appointment={appointment}
            onMarkClientArrived={onMarkClientArrived}
            onMarkVehicleArrived={onMarkVehicleArrived}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </Box>
    </Box>
  );
}

interface MultiDayBarProps {
  appointment: AppointmentResponse;
  onClick: (appointment: AppointmentResponse) => void;
}

export function MultiDayBar({ appointment, onClick }: MultiDayBarProps) {
  const tagColor = appointment.tags[0]?.color ?? "#1976d2";

  return (
    <Box
      onClick={() => onClick(appointment)}
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: alpha(tagColor, 0.85),
        color: "#fff",
        cursor: "pointer",
        fontSize: "0.7rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        lineHeight: 1.5,
        transition: "background-color 0.15s",
        "&:hover": {
          bgcolor: tagColor,
        },
      }}
    >
      {appointment.title ?? `Cita #${appointment.id}`}
    </Box>
  );
}
