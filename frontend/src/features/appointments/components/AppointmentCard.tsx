import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import dayjs from "dayjs";

import { AppointmentActions } from "./AppointmentActions";

import type { AppointmentResponse } from "@/types/appointment";

interface AppointmentCardProps {
  appointment: AppointmentResponse;
  variant?: "block" | "chip";
  onClick: (appointment: AppointmentResponse) => void;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

function getEventColor(appointment: AppointmentResponse): string {
  return appointment.tags[0]?.color ?? "#1a73e8";
}

export function AppointmentCard({
  appointment,
  variant = "block",
  onClick,
  onMarkClientArrived,
  onMarkVehicleArrived,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const color = getEventColor(appointment);
  const title = appointment.title ?? `Cita #${appointment.id}`;
  const timeLabel = `${dayjs(appointment.startTime).format("HH:mm")} - ${dayjs(appointment.endTime).format("HH:mm")}`;

  if (variant === "chip") {
    return (
      <Box
        onClick={() => onClick(appointment)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
          overflow: "hidden",
        }}
      >
        <FiberManualRecordIcon sx={{ fontSize: 8, color, flexShrink: 0 }} />
        <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "text.primary" }} noWrap>
          <Box component="span" sx={{ color: "text.secondary", mr: 0.5 }}>
            {dayjs(appointment.startTime).format("HH:mm")}
          </Box>
          {title}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: color,
        color: "#fff",
        borderRadius: 1,
        px: 1,
        py: 0.5,
        cursor: "pointer",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "filter 0.15s",
        "&:hover": {
          filter: "brightness(0.9)",
        },
      }}
      onClick={() => onClick(appointment)}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{ fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.3 }}
            noWrap
          >
            {title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25, opacity: 0.9 }}>
            <AccessTimeIcon sx={{ fontSize: 11 }} />
            <Typography sx={{ fontSize: "0.68rem", lineHeight: 1.2 }} noWrap>
              {timeLabel}
            </Typography>
          </Box>
        </Box>
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{ "& .MuiIconButton-root": { color: alpha("#fff", 0.8), "&:hover": { color: "#fff" } } }}
        >
          <AppointmentActions
            appointment={appointment}
            onMarkClientArrived={onMarkClientArrived}
            onMarkVehicleArrived={onMarkVehicleArrived}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Box>
      </Box>
      {appointment.clientFullName && (
        <Typography sx={{ fontSize: "0.68rem", opacity: 0.9, mt: 0.25 }} noWrap>
          {appointment.clientArrived && "● "}
          {appointment.clientFullName}
          {appointment.vehiclePlate && ` — ${appointment.vehiclePlate}`}
        </Typography>
      )}
    </Box>
  );
}

interface MultiDayBarProps {
  appointment: AppointmentResponse;
  onClick: (appointment: AppointmentResponse) => void;
}

export function MultiDayBar({ appointment, onClick }: MultiDayBarProps) {
  const color = getEventColor(appointment);

  return (
    <Box
      onClick={() => onClick(appointment)}
      sx={{
        px: 1,
        borderRadius: 1,
        bgcolor: color,
        color: "#fff",
        cursor: "pointer",
        fontSize: "0.72rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        lineHeight: "22px",
        height: "100%",
        transition: "filter 0.15s",
        "&:hover": {
          filter: "brightness(0.9)",
        },
      }}
    >
      {appointment.title ?? `Cita #${appointment.id}`}
    </Box>
  );
}
