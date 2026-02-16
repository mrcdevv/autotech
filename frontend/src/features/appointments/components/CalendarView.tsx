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
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
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

// ---- Shared ----

const HOUR_HEIGHT = 48;
const TIME_GUTTER = 56;
const DAY_NAMES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const ALL_DAY_ROW_H = 24;

function isMultiDay(apt: AppointmentResponse): boolean {
  return !dayjs(apt.startTime).isSame(dayjs(apt.endTime), "day");
}

function overlapsDay(apt: AppointmentResponse, dateStr: string): boolean {
  const ds = dayjs(dateStr).startOf("day");
  const de = ds.endOf("day");
  return dayjs(apt.startTime).isBefore(de) && dayjs(apt.endTime).isAfter(ds);
}

function getTopAndHeight(apt: AppointmentResponse, dateStr: string, startH: number, endH: number) {
  const ds = dayjs(dateStr).hour(startH).minute(0);
  const de = dayjs(dateStr).hour(endH).minute(0);
  const s = dayjs(apt.startTime).isBefore(ds) ? ds : dayjs(apt.startTime);
  const e = dayjs(apt.endTime).isAfter(de) ? de : dayjs(apt.endTime);
  const topMin = s.hour() * 60 + s.minute() - startH * 60;
  const durMin = e.diff(s, "minute");
  return { top: (topMin / 60) * HOUR_HEIGHT, height: Math.max((durMin / 60) * HOUR_HEIGHT, 22) };
}

interface CardActions {
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

function TimeGutter({ hours }: { hours: number[] }) {
  return (
    <Box sx={{ width: TIME_GUTTER, flexShrink: 0 }}>
      {hours.map((h) => (
        <Box key={h} sx={{ height: HOUR_HEIGHT, position: "relative" }}>
          <Typography
            sx={{
              position: "absolute",
              top: -8,
              right: 8,
              fontSize: "0.68rem",
              color: "text.disabled",
              userSelect: "none",
            }}
          >
            {h === hours[0] ? "" : `${h.toString().padStart(2, "0")}:00`}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function DayHeader({ d, showDate = true }: { d: Dayjs; showDate?: boolean }) {
  const isToday = d.isSame(dayjs(), "day");
  return (
    <Box sx={{ textAlign: "center", py: 0.5, flex: 1 }}>
      <Typography sx={{ fontSize: "0.68rem", fontWeight: 500, color: isToday ? "primary.main" : "text.disabled", letterSpacing: 0.5 }}>
        {DAY_NAMES[d.day()]}
      </Typography>
      {showDate && (
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: isToday ? 500 : 400,
            color: isToday ? "primary.contrastText" : "text.primary",
            bgcolor: isToday ? "primary.main" : "transparent",
            borderRadius: "50%",
            width: 40,
            height: 40,
            lineHeight: "40px",
            mx: "auto",
          }}
        >
          {d.date()}
        </Typography>
      )}
    </Box>
  );
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
    <Paper variant="outlined" sx={{ bgcolor: "background.paper", overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ width: TIME_GUTTER, flexShrink: 0 }} />
        <DayHeader d={dayjs(date)} />
      </Box>

      {/* All-day */}
      {allDay.length > 0 && (
        <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ width: TIME_GUTTER, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1 }}>
            <Typography sx={{ fontSize: "0.65rem", color: "text.disabled" }}>todo el día</Typography>
          </Box>
          <Box sx={{ flex: 1, py: 0.5, px: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
            {allDay.map((apt) => (
              <MultiDayBar key={apt.id} appointment={apt} onClick={onAppointmentClick} />
            ))}
          </Box>
        </Box>
      )}

      {/* Time grid */}
      <Box sx={{ display: "flex" }}>
        <TimeGutter hours={hours} />
        <Box sx={{ flex: 1, position: "relative", minHeight: hours.length * HOUR_HEIGHT, borderLeft: 1, borderColor: "divider" }}>
          {hours.map((h) => (
            <Box key={h} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: "divider" }} />
          ))}
          {timed.map((apt) => {
            const { top, height } = getTopAndHeight(apt, dateStr, startHour, endHour);
            return (
              <Box key={apt.id} sx={{ position: "absolute", top, left: 4, right: 12, height, zIndex: 1 }}>
                <AppointmentCard appointment={apt} onClick={onAppointmentClick} {...cardProps} />
              </Box>
            );
          })}
        </Box>
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
    <Paper variant="outlined" sx={{ bgcolor: "background.paper", overflow: "auto" }}>
      {/* Header row */}
      <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ width: TIME_GUTTER, flexShrink: 0 }} />
        {days.map((d, i) => (
          <DayHeader key={i} d={d} />
        ))}
      </Box>

      {/* All-day section */}
      {allDayRows.length > 0 && (
        <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ width: TIME_GUTTER, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1 }}>
            <Typography sx={{ fontSize: "0.65rem", color: "text.disabled" }}>todo el día</Typography>
          </Box>
          <Box sx={{ flex: 1, position: "relative", minHeight: allDayRows.length * (ALL_DAY_ROW_H + 2) + 4 }}>
            {allDayRows.map((row, rowIdx) =>
              row.map((item) => (
                <Box
                  key={`md-${item.apt.id}-${rowIdx}`}
                  sx={{
                    position: "absolute",
                    top: rowIdx * (ALL_DAY_ROW_H + 2) + 2,
                    left: `calc(${(item.startCol / 7) * 100}% + 2px)`,
                    width: `calc(${(item.spanCols / 7) * 100}% - 4px)`,
                    height: ALL_DAY_ROW_H,
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
      <Box sx={{ display: "flex" }}>
        <TimeGutter hours={hours} />
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
                bgcolor: isToday ? "rgba(26,115,232,0.04)" : "transparent",
              }}
            >
              {hours.map((h) => (
                <Box key={h} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: "divider" }} />
              ))}
              {dayAppts.map((apt) => {
                const { top, height } = getTopAndHeight(apt, dateStr, startHour, endHour);
                return (
                  <Box key={apt.id} sx={{ position: "absolute", top, left: 2, right: 4, height, zIndex: 1 }}>
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

// ---- Multi-day layout ----

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
      if (!row.some((e) => item.startCol < e.startCol + e.spanCols && item.startCol + item.spanCols > e.startCol)) {
        row.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([item]);
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
    <Paper variant="outlined" sx={{ bgcolor: "background.paper" }}>
      {/* Day headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: 1, borderColor: "divider" }}>
        {DAY_NAMES.map((name) => (
          <Box key={name} sx={{ textAlign: "center", py: 1 }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 500, color: "text.disabled", letterSpacing: 0.5 }}>
              {name}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Week rows */}
      {weekRows.map((weekDays, weekIdx) => {
        const weekMulti = layoutMultiDayRows(
          multiDay.filter((apt) => weekDays.some((d) => overlapsDay(apt, d.format("YYYY-MM-DD")))),
          weekDays,
        );
        const multiH = weekMulti.length * (ALL_DAY_ROW_H + 2);

        return (
          <Box
            key={weekIdx}
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              borderBottom: weekIdx < weeks - 1 ? 1 : 0,
              borderColor: "divider",
              position: "relative",
            }}
          >
            {/* Multi-day bars rendered once per row at grid level */}
            {weekMulti.map((row, rowIdx) =>
              row.map((item) => (
                <Box
                  key={`md-${item.apt.id}-${rowIdx}`}
                  sx={{
                    position: "absolute",
                    top: 28 + rowIdx * (ALL_DAY_ROW_H + 2),
                    left: `calc(${(item.startCol / 7) * 100}% + 2px)`,
                    width: `calc(${(item.spanCols / 7) * 100}% - 4px)`,
                    height: ALL_DAY_ROW_H,
                    zIndex: 2,
                  }}
                >
                  <MultiDayBar appointment={item.apt} onClick={onAppointmentClick} />
                </Box>
              ))
            )}

            {weekDays.map((d, colIdx) => {
              const dateStr = d.format("YYYY-MM-DD");
              const daySingle = singleDay.filter((a) => overlapsDay(a, dateStr));
              const isCurrentMonth = d.month() === dayjs(date).month();
              const isToday = d.isSame(dayjs(), "day");

              return (
                <Box
                  key={colIdx}
                  sx={{
                    minHeight: 100 + multiH,
                    borderRight: colIdx < 6 ? 1 : 0,
                    borderColor: "divider",
                    pt: 0.5,
                    px: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: isToday ? 500 : 400,
                      color: isToday ? "primary.contrastText" : isCurrentMonth ? "text.primary" : "text.disabled",
                      bgcolor: isToday ? "primary.main" : "transparent",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      lineHeight: "24px",
                      textAlign: "center",
                      display: "inline-block",
                      mb: 0.5,
                    }}
                  >
                    {d.date()}
                  </Typography>

                  {/* Spacer for multi-day bars */}
                  {multiH > 0 && <Box sx={{ height: multiH + 4 }} />}

                  {/* Single-day events */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                    {daySingle.slice(0, 3).map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        variant="chip"
                        onClick={onAppointmentClick}
                        {...cardProps}
                      />
                    ))}
                    {daySingle.length > 3 && (
                      <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", pl: 0.5, cursor: "pointer", "&:hover": { color: "text.primary" } }}>
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
