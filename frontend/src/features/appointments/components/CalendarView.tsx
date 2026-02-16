import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import dayjs from "dayjs";

import { AppointmentCard, MultiDayBar } from "./AppointmentCard";

import type { Dayjs } from "dayjs";
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

// ---- Shared helpers ----

const HOUR_HEIGHT = 60;
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ALL_DAY_ROW_HEIGHT = 26;

function isMultiDay(apt: AppointmentResponse): boolean {
  return !dayjs(apt.startTime).isSame(dayjs(apt.endTime), "day");
}

function overlapsDay(apt: AppointmentResponse, dateStr: string): boolean {
  const dayStart = dayjs(dateStr).startOf("day");
  const dayEnd = dayStart.endOf("day");
  return dayjs(apt.startTime).isBefore(dayEnd) && dayjs(apt.endTime).isAfter(dayStart);
}

function getTopAndHeight(apt: AppointmentResponse, dateStr: string, startHour: number, endHour: number): { top: number; height: number } {
  const dayStart = dayjs(dateStr).hour(startHour).minute(0).second(0);
  const dayEnd = dayjs(dateStr).hour(endHour).minute(0).second(0);
  const clampedStart = dayjs(apt.startTime).isBefore(dayStart) ? dayStart : dayjs(apt.startTime);
  const clampedEnd = dayjs(apt.endTime).isAfter(dayEnd) ? dayEnd : dayjs(apt.endTime);
  const startMinutes = clampedStart.hour() * 60 + clampedStart.minute() - startHour * 60;
  const durationMinutes = clampedEnd.diff(clampedStart, "minute");
  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 24),
  };
}

interface CardActions {
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

// ---- Day View ----

interface DayViewProps extends CardActions {
  appointments: AppointmentResponse[];
  date: Date;
  startHour: number;
  endHour: number;
  onAppointmentClick: (appointment: AppointmentResponse) => void;
}

function DayView({ appointments, date, startHour, endHour, onAppointmentClick, ...cardProps }: DayViewProps) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  const allDay = appointments.filter((a) => isMultiDay(a) && overlapsDay(a, dateStr));
  const timed = appointments.filter((a) => !isMultiDay(a) && overlapsDay(a, dateStr));

  return (
    <Paper variant="outlined" sx={{ overflow: "auto" }}>
      {allDay.length > 0 && (
        <Box sx={{ px: 1, py: 0.5, bgcolor: "grey.50", borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Todo el día</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {allDay.map((apt) => (
              <MultiDayBar key={apt.id} appointment={apt} onClick={onAppointmentClick} />
            ))}
          </Box>
        </Box>
      )}
      <Box sx={{ position: "relative", minHeight: hours.length * HOUR_HEIGHT, p: 1 }}>
        {hours.map((h) => (
          <Box key={h} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "flex-start" }}>
            <Typography variant="caption" sx={{ width: 50, flexShrink: 0, color: "text.secondary", mt: -0.8 }}>
              {`${h.toString().padStart(2, "0")}:00`}
            </Typography>
          </Box>
        ))}
        {timed.map((apt) => {
          const { top, height } = getTopAndHeight(apt, dateStr, startHour, endHour);
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

interface WeekViewProps extends CardActions {
  appointments: AppointmentResponse[];
  date: Date;
  startHour: number;
  endHour: number;
  onAppointmentClick: (appointment: AppointmentResponse) => void;
}

function WeekView({ appointments, date, startHour, endHour, onAppointmentClick, ...cardProps }: WeekViewProps) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const weekStart = dayjs(date).startOf("week");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

  const multiDay = appointments.filter((a) => isMultiDay(a));
  const allDayRows = layoutMultiDayRows(multiDay, days);

  return (
    <Paper variant="outlined" sx={{ overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ width: 50, flexShrink: 0 }} />
        {days.map((d, i) => {
          const isToday = d.isSame(dayjs(), "day");
          return (
            <Box key={i} sx={{ flex: 1, textAlign: "center", py: 0.5 }}>
              <Typography variant="caption" fontWeight="bold" color={isToday ? "primary.main" : "text.primary"}>
                {DAY_NAMES[d.day()]}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                sx={{
                  color: isToday ? "primary.contrastText" : "text.secondary",
                  bgcolor: isToday ? "primary.main" : "transparent",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  lineHeight: "24px",
                  mx: "auto",
                  fontSize: "0.75rem",
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {d.format("D")}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* All-day section */}
      {allDayRows.length > 0 && (
        <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider", bgcolor: "grey.50" }}>
          <Box sx={{ width: 50, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
              Día
            </Typography>
          </Box>
          <Box sx={{ flex: 1, position: "relative", minHeight: allDayRows.length * ALL_DAY_ROW_HEIGHT + 4 }}>
            {allDayRows.map((row, rowIdx) =>
              row.map((item) => (
                <Box
                  key={`${item.apt.id}-${rowIdx}`}
                  sx={{
                    position: "absolute",
                    top: rowIdx * ALL_DAY_ROW_HEIGHT + 2,
                    left: `calc(${(item.startCol / 7) * 100}% + 2px)`,
                    width: `calc(${(item.spanCols / 7) * 100}% - 4px)`,
                    height: ALL_DAY_ROW_HEIGHT - 4,
                  }}
                >
                  <MultiDayBar appointment={item.apt} onClick={onAppointmentClick} />
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {/* Time grid */}
      <Box sx={{ display: "flex", position: "relative" }}>
        <Box sx={{ width: 50, flexShrink: 0 }}>
          {hours.map((h) => (
            <Box key={h} sx={{ height: HOUR_HEIGHT, display: "flex", alignItems: "flex-start" }}>
              <Typography variant="caption" color="text.secondary" sx={{ mt: -0.8, width: "100%", textAlign: "right", pr: 0.5 }}>
                {`${h.toString().padStart(2, "0")}:00`}
              </Typography>
            </Box>
          ))}
        </Box>
        {days.map((d, i) => {
          const dateStr = d.format("YYYY-MM-DD");
          const dayAppts = appointments.filter((a) => !isMultiDay(a) && overlapsDay(a, dateStr));
          const isToday = d.isSame(dayjs(), "day");
          return (
            <Box
              key={i}
              sx={{
                flex: 1,
                position: "relative",
                borderLeft: 1,
                borderColor: "divider",
                minHeight: hours.length * HOUR_HEIGHT,
                bgcolor: isToday ? "primary.50" : "transparent",
              }}
            >
              {hours.map((h) => (
                <Box key={h} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: "divider" }} />
              ))}
              {dayAppts.map((apt) => {
                const { top, height } = getTopAndHeight(apt, dateStr, startHour, endHour);
                return (
                  <Box key={apt.id} sx={{ position: "absolute", top, left: 2, right: 2, height, zIndex: 1 }}>
                    <AppointmentCard appointment={apt} compact={height < 40} onClick={onAppointmentClick} {...cardProps} />
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

interface MultiDayLayoutItem {
  apt: AppointmentResponse;
  startCol: number;
  spanCols: number;
}

function layoutMultiDayRows(multiDay: AppointmentResponse[], days: Dayjs[]): MultiDayLayoutItem[][] {
  const rows: MultiDayLayoutItem[][] = [];

  for (const apt of multiDay) {
    const aptStart = dayjs(apt.startTime);
    const aptEnd = dayjs(apt.endTime);
    let startCol = -1;
    let endCol = -1;

    for (let i = 0; i < days.length; i++) {
      const d = days[i]!;
      if (aptStart.isBefore(d.endOf("day")) && aptEnd.isAfter(d.startOf("day"))) {
        if (startCol === -1) startCol = i;
        endCol = i;
      }
    }

    if (startCol === -1) continue;

    const item: MultiDayLayoutItem = { apt, startCol, spanCols: endCol - startCol + 1 };

    let placed = false;
    for (const row of rows) {
      const conflicts = row.some(
        (existing) =>
          item.startCol < existing.startCol + existing.spanCols &&
          item.startCol + item.spanCols > existing.startCol,
      );
      if (!conflicts) {
        row.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([item]);
    }
  }

  return rows;
}

// ---- Month View ----

interface MonthViewProps extends CardActions {
  appointments: AppointmentResponse[];
  date: Date;
  onAppointmentClick: (appointment: AppointmentResponse) => void;
}

function MonthView({ appointments, date, onAppointmentClick, ...cardProps }: MonthViewProps) {
  const monthStart = dayjs(date).startOf("month");
  const calendarStart = monthStart.startOf("week");
  const monthEnd = dayjs(date).endOf("month");
  const calendarEnd = monthEnd.endOf("week");
  const totalDays = calendarEnd.diff(calendarStart, "day") + 1;
  const weeks = Math.ceil(totalDays / 7);

  const allCells = Array.from({ length: weeks * 7 }, (_, i) => calendarStart.add(i, "day"));
  const weekRows = Array.from({ length: weeks }, (_, w) => allCells.slice(w * 7, w * 7 + 7));

  const multiDay = appointments.filter((a) => isMultiDay(a));
  const singleDay = appointments.filter((a) => !isMultiDay(a));

  return (
    <Paper variant="outlined" sx={{ p: 0 }}>
      {/* Day headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: 1, borderColor: "divider" }}>
        {DAY_NAMES.map((name) => (
          <Box key={name} sx={{ textAlign: "center", py: 0.5 }}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary">{name}</Typography>
          </Box>
        ))}
      </Box>

      {/* Week rows */}
      {weekRows.map((weekDays, weekIdx) => {
        const weekMultiDay = layoutMultiDayRows(
          multiDay.filter((apt) => weekDays.some((d) => overlapsDay(apt, d.format("YYYY-MM-DD")))),
          weekDays,
        );
        const multiDayHeight = weekMultiDay.length * (ALL_DAY_ROW_HEIGHT + 2);

        return (
          <Box key={weekIdx} sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: weekIdx < weeks - 1 ? 1 : 0, borderColor: "divider" }}>
            {weekDays.map((d, colIdx) => {
              const dateStr = d.format("YYYY-MM-DD");
              const daySingle = singleDay.filter((a) => overlapsDay(a, dateStr));
              const isCurrentMonth = d.month() === dayjs(date).month();
              const isToday = d.isSame(dayjs(), "day");

              return (
                <Box
                  key={colIdx}
                  sx={{
                    minHeight: 90 + multiDayHeight,
                    borderRight: colIdx < 6 ? 1 : 0,
                    borderColor: "divider",
                    p: 0.5,
                    bgcolor: isCurrentMonth ? "background.paper" : "grey.50",
                    position: "relative",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? "primary.contrastText" : isCurrentMonth ? "text.primary" : "text.disabled",
                      bgcolor: isToday ? "primary.main" : "transparent",
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                      lineHeight: "22px",
                      textAlign: "center",
                      display: "inline-block",
                      fontSize: "0.72rem",
                    }}
                  >
                    {d.date()}
                  </Typography>

                  {/* Multi-day bars (only render in first column of span) */}
                  {colIdx === 0 && weekMultiDay.map((row, rowIdx) =>
                    row.map((item) => (
                      <Box
                        key={`${item.apt.id}-${rowIdx}`}
                        sx={{
                          position: "absolute",
                          top: 24 + rowIdx * (ALL_DAY_ROW_HEIGHT + 2),
                          left: `calc(${(item.startCol / 7) * 100}% + 2px)`,
                          width: `calc(${(item.spanCols / 7) * 100}% - 4px)`,
                          height: ALL_DAY_ROW_HEIGHT,
                          zIndex: 2,
                        }}
                      >
                        <MultiDayBar appointment={item.apt} onClick={onAppointmentClick} />
                      </Box>
                    ))
                  )}

                  {/* Single-day appointments */}
                  <Box sx={{ mt: multiDayHeight > 0 ? `${multiDayHeight + 4}px` : 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {daySingle.slice(0, 3).map((apt) => (
                      <AppointmentCard key={apt.id} appointment={apt} compact onClick={onAppointmentClick} {...cardProps} />
                    ))}
                    {daySingle.length > 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                        +{daySingle.length - 3} más
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Paper>
  );
}
