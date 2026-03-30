import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import dayjs from "dayjs";

import type { AppointmentResponse } from "@/types/appointment";

interface AppointmentCardProps {
  appointment: AppointmentResponse;
  variant?: "block" | "month";
  showFullTags?: boolean;
  overlappingCount?: number;
  onOverlapClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onClick: (appointment: AppointmentResponse) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, appointment: AppointmentResponse) => void;
}

function getEventColor(_appointment: AppointmentResponse): string {
  // Vibrant blue for better contrast with white text
  return "#2563eb"; // Tailwind blue-600
}

function getDisplayTitle(appointment: AppointmentResponse): string {
  return appointment.title ?? `Cita #${appointment.id}`;
}

export function AppointmentCard({
  appointment,
  variant = "block",
  showFullTags = false,
  overlappingCount = 0,
  onOverlapClick,
  onClick,
  onMenuOpen,
}: AppointmentCardProps) {
  const color = getEventColor(appointment);
  const title = getDisplayTitle(appointment);
  const timeLabel = `${dayjs(appointment.startTime).format("HH:mm")} - ${dayjs(appointment.endTime).format("HH:mm")}`;
  const isCancelled = appointment.status === "CANCELLED";
  const isCompleted = appointment.status === "COMPLETED";
  const isInProgress = !isCancelled && !isCompleted && appointment.vehicleArrivedAt !== null;

  if (variant === "month") {
    return (
      <Box
        onClick={() => onClick(appointment)}
        sx={{
          bgcolor: color,
          color: "#fff",
          borderRadius: 0.75,
          px: 1,
          py: 0.5,
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0.5,
          minHeight: 24,
          opacity: isCancelled ? 0.6 : 1,
          transition: "filter 0.15s",
          "&:hover": { filter: "brightness(0.9)" },
          "&:hover .month-actions": { opacity: 1 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1, minWidth: 0 }}>
          {appointment.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.25, alignItems: "center", flexShrink: 0 }}>
              {appointment.tags.slice(0, 3).map((tag) => (
                <Tooltip key={tag.id} title={tag.name} arrow placement="top">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: tag.color || "#1a73e8",
                      flexShrink: 0,
                      border: "1px solid rgba(255,255,255,0.8)",
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
          <Typography
            color="inherit"
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              lineHeight: 1.3,
              textDecoration: isCancelled ? "line-through" : "none",
              flex: 1,
              minWidth: 0,
              letterSpacing: "0.01em",
            }}
            noWrap
          >
            {dayjs(appointment.startTime).format("HH:mm")} {title}
          </Typography>
          {isCompleted && (
            <Tooltip title="Completada" arrow>
              <CheckCircleIcon sx={{ fontSize: 12, color: "#fff", flexShrink: 0 }} />
            </Tooltip>
          )}
          {isInProgress && (
            <Tooltip title="En progreso" arrow>
              <DirectionsCarIcon sx={{ fontSize: 12, color: "rgba(255, 255, 255, 0.9)", flexShrink: 0 }} />
            </Tooltip>
          )}
        </Box>
        <Box
          className="month-actions"
          onClick={(e) => e.stopPropagation()}
          sx={{ opacity: 0, transition: "opacity 0.15s", flexShrink: 0, overflow: "visible", zIndex: 10 }}
        >
          <IconButton
            size="small"
            sx={{ 
              p: 0, 
              color: alpha("#fff", 0.85), 
              "&:hover": { 
                color: "#fff",
                bgcolor: alpha("#000", 0.1),
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMenuOpen(e, appointment);
            }}
          >
            <MoreVertIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: color,
        color: "#fff",
        borderRadius: 1.5,
        boxShadow: `inset 5px 0 0 0 #1e40af, 0 1px 3px 0 ${alpha("#000", 0.15)}`, // Using a darker blue exact color for the contour
        p: 1.5,
        pr: 1, // slightly less padding on the right to make room for the menu
        cursor: "pointer",
        position: "relative",
        height: "100%",
        minHeight: 48,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: isCancelled ? 0.5 : 1,
        transition: "filter 0.15s",
        "&:hover": { filter: "brightness(0.9)" },
        "&:hover .block-actions": { opacity: 1 },
      }}
      onClick={() => onClick(appointment)}
    >
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.5, mb: 0.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
              {!showFullTags && appointment.tags.length > 0 && (
                <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                  {appointment.tags.slice(0, 3).map((tag) => (
                    <Tooltip key={tag.id} title={tag.name} arrow placement="top">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: tag.color || "#1a73e8",
                          border: "2px solid rgba(255,255,255,0.8)",
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              )}
              <Typography
                color="inherit"
                sx={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textDecoration: isCancelled ? "line-through" : "none",
                  letterSpacing: "0.01em",
                }}
                noWrap
              >
                {title}
              </Typography>
            </Box>
            <Typography color="inherit" sx={{ fontSize: "0.85rem", lineHeight: 1.2, opacity: 0.9, mb: 0.5 }} noWrap>
              {timeLabel}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            {isCompleted && (
              <Tooltip title="Completada" arrow>
                <CheckCircleIcon sx={{ fontSize: 16, color: "#fff" }} />
              </Tooltip>
            )}
            {isInProgress && (
              <Tooltip title="En progreso" arrow>
                <DirectionsCarIcon sx={{ fontSize: 16, color: "rgba(255, 255, 255, 0.9)" }} />
              </Tooltip>
            )}
            <Box
              className="block-actions"
              onClick={(e) => e.stopPropagation()}
              sx={{ opacity: 0, transition: "opacity 0.15s", overflow: "visible", zIndex: 10 }}
            >
              <IconButton
                size="small"
                sx={{ 
                  p: 0.25, 
                  color: alpha("#fff", 0.8), 
                  "&:hover": { 
                    color: "#fff",
                    bgcolor: alpha("#000", 0.1),
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuOpen(e, appointment);
                }}
              >
                <MoreVertIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
        {appointment.clientFullName && (
          <Typography color="inherit" sx={{ fontSize: "0.85rem", opacity: 0.9, mt: 0.25 }} noWrap>
            {appointment.clientFullName}
            {appointment.vehiclePlate && ` — ${appointment.vehiclePlate}`}
          </Typography>
        )}
      </Box>
      
      <Box>
        {showFullTags && appointment.tags.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, mb: 0.5, flexWrap: "wrap" }}>
            {appointment.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  bgcolor: alpha("#fff", 0.2),
                  color: "#fff",
                  border: `1px solid ${alpha("#fff", 0.3)}`,
                  "& .MuiChip-label": { px: 0.75, py: 0 },
                }}
              />
            ))}
          </Box>
        )}
        
        {overlappingCount > 0 && onOverlapClick ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
            <Chip
              label={`+${overlappingCount}`}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onOverlapClick(e);
              }}
              sx={{
                height: 18,
                fontSize: "0.65rem",
                bgcolor: alpha("#fff", 0.25),
                color: "#fff",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: alpha("#fff", 0.35),
                },
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

interface MultiDayBarProps {
  appointment: AppointmentResponse;
  onClick: (appointment: AppointmentResponse) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, appointment: AppointmentResponse) => void;
}

export function MultiDayBar({ appointment, onClick, onMenuOpen }: MultiDayBarProps) {
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
        fontSize: "0.8rem",
        fontWeight: 600,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.5,
        transition: "filter 0.15s",
        "&:hover": { filter: "brightness(0.9)" },
        "&:hover .bar-actions": { opacity: 1 },
      }}
    >
      <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
        {getDisplayTitle(appointment)}
      </Box>
      {appointment.tags.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexShrink: 0 }}>
          {appointment.tags.map((tag) => (
            <Tooltip key={tag.id} title={tag.name} arrow placement="top">
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: tag.color || "#fff",
                  flexShrink: 0,
                  border: "1px solid rgba(255,255,255,0.8)",
                }}
              />
            </Tooltip>
          ))}
        </Box>
      )}
      <Box
        className="bar-actions"
        onClick={(e) => e.stopPropagation()}
        sx={{ opacity: 0, transition: "opacity 0.15s", flexShrink: 0, overflow: "visible", zIndex: 10 }}
      >
        <IconButton
          size="small"
          sx={{ 
            p: 0, 
            color: alpha("#fff", 0.85), 
            "&:hover": { 
              color: "#fff",
              bgcolor: alpha("#000", 0.1),
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen(e, appointment);
          }}
        >
          <MoreVertIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
