import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import { AppointmentCard } from "./AppointmentCard";

import type { AppointmentResponse, CalendarViewMode } from "@/types/appointment";

interface CalendarViewProps {
  appointments: AppointmentResponse[];
  viewMode: CalendarViewMode;
  currentDate: Date;
  loading: boolean;
  businessStartHour: number;
  businessEndHour: number;
  onAppointmentClick: (appointment: AppointmentResponse) => void;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

export function CalendarView({
  appointments,
  viewMode,
  currentDate,
  loading,
  businessStartHour,
  businessEndHour,
  onAppointmentClick,
  onMarkClientArrived,
  onMarkVehicleArrived,
  onEdit,
  onDelete,
}: CalendarViewProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const cardProps = { onMarkClientArrived, onMarkVehicleArrived, onEdit, onDelete };

  switch (viewMode) {
    case "day":
      return (
        <DayView
          appointments={appointments}
          date={currentDate}
          startHour={businessStartHour}
          endHour={businessEndHour}
          onAppointmentClick={onAppointmentClick}
          {...cardProps}
        />
      );
    case "week":
      return (
        <WeekView
          appointments={appointments}
          date={currentDate}
          startHour={businessStartHour}
          endHour={businessEndHour}
          onAppointmentClick={onAppointmentClick}
          {...cardProps}
        />
      );
    case "month":
      return (
        <MonthView
          appointments={appointments}
          date={currentDate}
          onAppointmentClick={onAppointmentClick}
          {...cardProps}
        />
      );
  }
}

const HOUR_HEIGHT = 60;
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface TimeGridProps {
  appointments: AppointmentResponse[];
  startHour: number;
  endHour: number;
  onAppointmentClick: (appointment: AppointmentResponse) => void;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

function getTopAndHeight(apt: AppointmentResponse, startHour: number): { top: number; height: number } {
  const start = dayjs(apt.startTime);
  const end = dayjs(apt.endTime);
  const startMinutes = start.hour() * 60 + start.minute() - startHour * 60;
  const durationMinutes = end.diff(start, "minute");
  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20),
  };
}

// ---- Day View ----

interface DayViewProps extends TimeGridProps {
  date: Date;
}

function DayView({ appointments, date, startHour, endHour, onAppointmentClick, ...cardProps }: DayViewProps) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  const dayAppts = appointments.filter((a) => dayjs(a.startTime).format("YYYY-MM-DD") === dateStr);

  return (
    <Paper sx={{ p: 1, overflow: "auto" }}>
      <Box sx={{ position: "relative", minHeight: hours.length * HOUR_HEIGHT }}>
        {hours.map((h) => (
          <Box
            key={h}
            sx={{
              height: HOUR_HEIGHT,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <Typography variant="caption" sx={{ width: 50, flexShrink: 0, color: "text.secondary" }}>
              {`${h.toString().padStart(2, "0")}:00`}
            </Typography>
          </Box>
        ))}
        {dayAppts.map((apt) => {
          const { top, height } = getTopAndHeight(apt, startHour);
          return (
            <Box key={apt.id} sx={{ position: "absolute", top, left: 55, right: 8, height, zIndex: 1 }}>
              <AppointmentCard appointment={apt} onClick={onAppointmentClick} {...cardProps} />
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

// ---- Week View ----

interface WeekViewProps extends TimeGridProps {
  date: Date;
}

function WeekView({ appointments, date, startHour, endHour, onAppointmentClick, ...cardProps }: WeekViewProps) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const weekStart = dayjs(date).startOf("week");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

  return (
    <Paper sx={{ p: 1, overflow: "auto" }}>
      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: 50, flexShrink: 0 }} />
        {days.map((d, i) => (
          <Box key={i} sx={{ flex: 1, textAlign: "center", borderBottom: 1, borderColor: "divider", pb: 0.5 }}>
            <Typography variant="caption" fontWeight="bold">
              {DAY_NAMES[d.day()]}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              {d.format("DD/MM")}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", position: "relative" }}>
        <Box sx={{ width: 50, flexShrink: 0 }}>
          {hours.map((h) => (
            <Box key={h} sx={{ height: HOUR_HEIGHT, display: "flex", alignItems: "flex-start" }}>
              <Typography variant="caption" color="text.secondary">
                {`${h.toString().padStart(2, "0")}:00`}
              </Typography>
            </Box>
          ))}
        </Box>
        {days.map((d, i) => {
          const dateStr = d.format("YYYY-MM-DD");
          const dayAppts = appointments.filter((a) => dayjs(a.startTime).format("YYYY-MM-DD") === dateStr);
          return (
            <Box
              key={i}
              sx={{
                flex: 1,
                position: "relative",
                borderLeft: 1,
                borderColor: "divider",
                minHeight: hours.length * HOUR_HEIGHT,
              }}
            >
              {hours.map((h) => (
                <Box key={h} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: "divider" }} />
              ))}
              {dayAppts.map((apt) => {
                const { top, height } = getTopAndHeight(apt, startHour);
                return (
                  <Box key={apt.id} sx={{ position: "absolute", top, left: 2, right: 2, height, zIndex: 1 }}>
                    <AppointmentCard appointment={apt} onClick={onAppointmentClick} {...cardProps} />
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

// ---- Month View ----

interface MonthViewProps {
  appointments: AppointmentResponse[];
  date: Date;
  onAppointmentClick: (appointment: AppointmentResponse) => void;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

function MonthView({ appointments, date, onAppointmentClick, ...cardProps }: MonthViewProps) {
  const monthStart = dayjs(date).startOf("month");
  const calendarStart = monthStart.startOf("week");
  const monthEnd = dayjs(date).endOf("month");
  const calendarEnd = monthEnd.endOf("week");
  const totalDays = calendarEnd.diff(calendarStart, "day") + 1;
  const weeks = Math.ceil(totalDays / 7);

  const cells = Array.from({ length: weeks * 7 }, (_, i) => calendarStart.add(i, "day"));

  return (
    <Paper sx={{ p: 1 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {DAY_NAMES.map((name) => (
          <Box key={name} sx={{ textAlign: "center", pb: 0.5 }}>
            <Typography variant="caption" fontWeight="bold">{name}</Typography>
          </Box>
        ))}
        {cells.map((d, i) => {
          const dateStr = d.format("YYYY-MM-DD");
          const dayAppts = appointments.filter((a) => dayjs(a.startTime).format("YYYY-MM-DD") === dateStr);
          const isCurrentMonth = d.month() === dayjs(date).month();
          return (
            <Box
              key={i}
              sx={{
                minHeight: 80,
                border: 1,
                borderColor: "divider",
                p: 0.5,
                bgcolor: isCurrentMonth ? "background.paper" : "action.hover",
              }}
            >
              <Typography
                variant="caption"
                fontWeight={d.isSame(dayjs(), "day") ? "bold" : "normal"}
                color={isCurrentMonth ? "text.primary" : "text.disabled"}
              >
                {d.date()}
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {dayAppts.slice(0, 3).map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} onClick={onAppointmentClick} {...cardProps} />
                ))}
                {dayAppts.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{dayAppts.length - 3} más
                  </Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
