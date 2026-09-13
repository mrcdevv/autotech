import { Box, Popover, Typography, List, ListItem, ListItemButton } from "@mui/material";
import dayjs from "dayjs";

import type { AppointmentResponse } from "@/types/appointment";

interface OverlappingAppointmentsMenuProps {
  anchorEl: HTMLElement | null;
  appointments: AppointmentResponse[];
  onClose: () => void;
  onSelect: (appointment: AppointmentResponse) => void;
}

function getEventColor(appointment: AppointmentResponse): string {
  return appointment.tags[0]?.color ?? "#1a73e8";
}

function getDisplayTitle(appointment: AppointmentResponse): string {
  return appointment.title ?? `Cita #${appointment.id}`;
}

export function OverlappingAppointmentsMenu({
  anchorEl,
  appointments,
  onClose,
  onSelect,
}: OverlappingAppointmentsMenuProps) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <Box sx={{ minWidth: 280, maxWidth: 320 }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "grey.200" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Citas superpuestas ({appointments.length})
          </Typography>
        </Box>
        <List sx={{ py: 0.5 }}>
          {appointments.map((apt) => {
            const color = getEventColor(apt);
            const timeLabel = `${dayjs(apt.startTime).format("HH:mm")} - ${dayjs(apt.endTime).format("HH:mm")}`;
            
            return (
              <ListItem key={apt.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    onSelect(apt);
                    onClose();
                  }}
                  sx={{ py: 1 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                    <Box
                      sx={{
                        width: 4,
                        height: 40,
                        bgcolor: color,
                        borderRadius: 1,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          mb: 0.25,
                        }}
                        noWrap
                      >
                        {getDisplayTitle(apt)}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }} noWrap>
                        {timeLabel}
                      </Typography>
                      {apt.clientFullName && (
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }} noWrap>
                          {apt.clientFullName}
                          {apt.vehiclePlate && ` — ${apt.vehiclePlate}`}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Popover>
  );
}
