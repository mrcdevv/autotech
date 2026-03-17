import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import type { TodayAppointmentResponse } from "@/features/dashboard/types";

interface TodayAppointmentsListProps {
  appointments: TodayAppointmentResponse[];
}

export function TodayAppointmentsList({ appointments }: TodayAppointmentsListProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Citas de hoy
        </Typography>
        {appointments.length === 0 ? (
          <Typography color="text.secondary">No hay citas para hoy</Typography>
        ) : (
          <List dense disablePadding>
            {appointments.map((a) => {
              const time = new Date(a.startTime).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <ListItem key={a.appointmentId} disableGutters>
                  <ListItemText
                    primary={`${time} — ${a.clientFullName ?? "Sin cliente"}`}
                    secondary={`${a.vehiclePlate ?? "Sin patente"} ${a.purpose ? `• ${a.purpose}` : ""}`}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
