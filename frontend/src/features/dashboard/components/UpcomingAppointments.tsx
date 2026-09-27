import { Typography } from "@mui/material";

import { MonoText } from "@/components/MonoText";
import { Panel } from "@/components/Panel";
import { PanelLink } from "@/components/PanelLink";
import { PanelRow } from "@/components/PanelRow";
import { RowText } from "@/components/RowText";
import type { AppointmentView } from "@/features/dashboard/utils/homeView";

interface UpcomingAppointmentsProps {
  appointments: AppointmentView[];
  onViewCalendar: () => void;
}

export function UpcomingAppointments({
  appointments,
  onViewCalendar,
}: UpcomingAppointmentsProps) {
  return (
    <Panel title="Próximas citas" contentSx={{ mt: "2px" }}>
      {appointments.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 1 }}>
          No hay citas próximas
        </Typography>
      ) : (
        appointments.map((appointment, index) => (
          <PanelRow key={`${appointment.time}-${appointment.client}-${index}`} align="baseline">
            <MonoText
              sx={{ fontSize: "0.75rem", color: "primary.main", flex: "none", width: 70 }}
            >
              {appointment.time}
            </MonoText>
            <RowText primary={appointment.client} secondary={appointment.detail} />
          </PanelRow>
        ))
      )}

      <PanelLink onClick={onViewCalendar} sx={{ display: "inline-block", mt: "8px" }}>
        Ver calendario →
      </PanelLink>
    </Panel>
  );
}
