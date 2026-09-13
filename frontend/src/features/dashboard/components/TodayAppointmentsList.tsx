import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  List,
  ListItem,
  Stack,
} from "@mui/material";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";

import type { TodayAppointmentResponse } from "@/features/dashboard/types";

interface TodayAppointmentsListProps {
  appointments: TodayAppointmentResponse[];
}

export function TodayAppointmentsList({ appointments }: TodayAppointmentsListProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="h6">Citas de hoy</Typography>
          <Chip size="small" label={appointments.length} color="primary" variant="outlined" />
        </Stack>
        {appointments.length === 0 ? (
          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              px: 2,
              py: 3,
              textAlign: "center",
              bgcolor: "grey.50",
            }}
          >
            <Typography color="text.secondary">No hay citas para hoy</Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {appointments.map((a) => {
              const time = new Date(a.startTime).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <ListItem
                  key={a.appointmentId}
                  disableGutters
                  sx={{
                    alignItems: "flex-start",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    px: 1.5,
                    py: 1,
                    mb: 1,
                    bgcolor: "background.paper",
                    "&:last-child": { mb: 0 },
                  }}
                >
                  <Chip
                    size="small"
                    label={time}
                    color="primary"
                    sx={{ mr: 1.5, mt: 0.25, minWidth: 62 }}
                  />
                  <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {a.clientFullName ?? "Sin cliente"}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <DirectionsCarOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                      <Typography variant="caption">
                        {a.vehiclePlate ?? "Sin patente"}
                      </Typography>
                    </Stack>
                    {a.purpose && (
                      <Typography variant="caption" color="text.secondary">
                        {a.purpose}
                      </Typography>
                    )}
                  </Stack>
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
