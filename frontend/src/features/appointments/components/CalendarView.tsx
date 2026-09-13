import { useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import dayjs from "dayjs";

import { AppointmentCard, MultiDayBar } from "./AppointmentCard";
import { OverlappingAppointmentsMenu } from "./OverlappingAppointmentsMenu";

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
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, appointment: AppointmentResponse) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({
  appointments,
  viewMode,
  currentDate,
  loading,
  businessStartHour,
  businessEndHour,
  onAppointmentClick,
  onMenuOpen,
  onDateClick,
}: CalendarViewProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  switch (viewMode) {
    case "day":
      return (
        <DayView
          appointments={appointments}
          date={currentDate}
          startHour={businessStartHour}
          endHour={businessEndHour}
          onAppointmentClick={onAppointmentClick}
          onMenuOpen={onMenuOpen}
          onDateClick={onDateClick}
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
          onMenuOpen={onMenuOpen}
          onDateClick={onDateClick}
        />
      );
    case "month":
      return (
        <MonthView
          appointments={appointments}
          date={currentDate}
          onAppointmentClick={onAppointmentClick}
          onMenuOpen={onMenuOpen}
          onDateClick={onDateClick}
        />
      );
  }
}

// ---- Shared ----

const HOUR_HEIGHT = 80;
const TIME_GUTTER = 64;
const DAY_NAMES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const ALL_DAY_ROW_H = 28;

function isMultiDay(apt: AppointmentResponse): boolean {
  const s = dayjs(apt.startTime);
  const e = dayjs(apt.endTime);
  return !s.isSame(e, "day") || e.diff(s, "hour") >= 23;
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
  return { top: (topMin / 60) * HOUR_HEIGHT, height: Math.max((durMin / 60) * HOUR_HEIGHT, 28) };
}

function appointmentsOverlap(apt1: AppointmentResponse, apt2: AppointmentResponse): boolean {
  const start1 = dayjs(apt1.startTime);
  const end1 = dayjs(apt1.endTime);
  const start2 = dayjs(apt2.startTime);
  const end2 = dayjs(apt2.endTime);
  return start1.isBefore(end2) && start2.isBefore(end1);
}

function getOverlappingGroups(appointments: AppointmentResponse[]): AppointmentResponse[][] {
  if (appointments.length === 0) return [];
  
  const sorted = [...appointments].sort((a, b) => 
    dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
  );
  
  const groups: AppointmentResponse[][] = [];
  
  for (const apt of sorted) {
    let addedToGroup = false;
    
    for (const group of groups) {
      if (group.some(existing => appointmentsOverlap(apt, existing))) {
        group.push(apt);
        addedToGroup = true;
        break;
      }
    }
    
    if (!addedToGroup) {
      groups.push([apt]);
    }
  }
  
  return groups;
}

interface SharedProps {
  onAppointmentClick: (appointment: AppointmentResponse) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, appointment: AppointmentResponse) => void;
  onDateClick?: (date: Date) => void;
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

function DayHeader({ d, showDate = true, onClick }: { d: Dayjs; showDate?: boolean; onClick?: () => void }) {
  const isToday = d.isSame(dayjs(), "day");
  return (
    <Box sx={{ textAlign: "center", py: 0.5, flex: 1, borderLeft: 1, borderColor: "grey.200" }}>
      <Typography sx={{ fontSize: "0.68rem", fontWeight: 500, color: isToday ? "primary.main" : "text.disabled", letterSpacing: 0.5 }}>
        {DAY_NAMES[d.day()]}
      </Typography>
      {showDate && (
        <Typography
          onClick={onClick}
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
            cursor: onClick ? "pointer" : "default",
            "&:hover": onClick ? { bgcolor: isToday ? "primary.dark" : "action.hover" } : {},
          }}
        >
          {d.date()}
        </Typography>
      )}
    </Box>
  );
}

// ---- Day View ----

interface DayViewProps extends SharedProps {
  appointments: AppointmentResponse[];
  date: Date;
  startHour: number;
  endHour: number;
}

function DayView({ appointments, date, startHour, endHour, onAppointmentClick, onMenuOpen, onDateClick }: DayViewProps) {
  const [overlapMenuAnchor, setOverlapMenuAnchor] = useState<HTMLElement | null>(null);
  const [overlapMenuAppts, setOverlapMenuAppts] = useState<AppointmentResponse[]>([]);
  
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  const allDay = appointments.filter((a) => isMultiDay(a) && overlapsDay(a, dateStr));
  const timed = appointments.filter((a) => !isMultiDay(a) && overlapsDay(a, dateStr));
  
  const overlappingGroups = getOverlappingGroups(timed);

  return (
    <Box sx={{ bgcolor: "background.paper", overflow: "auto", border: "1px solid", borderColor: "grey.200", borderRadius: 3 }}>
      <Box sx={{ display: "flex", borderBottom: 1, borderColor: "grey.200" }}>
        <Box sx={{ width: TIME_GUTTER, flexShrink: 0 }} />
        <DayHeader d={dayjs(date)} onClick={() => onDateClick?.(date)} />
      </Box>

      {allDay.length > 0 && (
        <Box sx={{ display: "flex", borderBottom: 1, borderColor: "grey.200" }}>
          <Box sx={{ width: TIME_GUTTER, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1 }}>
            <Typography sx={{ fontSize: "0.65rem", color: "text.disabled", textAlign: "right" }}>Todo el<br/>día</Typography>
          </Box>
          <Box sx={{ flex: 1, py: 0.5, px: 0.5, display: "flex", flexDirection: "column", gap: 0.5, borderLeft: 1, borderColor: "grey.200" }}>
            {allDay.map((apt) => (
              <MultiDayBar key={apt.id} appointment={apt} onClick={onAppointmentClick} onMenuOpen={onMenuOpen} />
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex" }}>
        <TimeGutter hours={hours} />
        <Box sx={{ flex: 1, position: "relative", minHeight: hours.length * HOUR_HEIGHT, borderLeft: 1, borderColor: "grey.200" }}>
          {hours.map((h) => (
            <Box key={h} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: "grey.200" }} />
          ))}
          {overlappingGroups.map((group, groupIdx) => {
            return group.map((apt, idx) => {
              const { top, height } = getTopAndHeight(apt, dateStr, startHour, endHour);
              const widthPct = 100 / group.length;
              const leftPct = widthPct * idx;
              return (
                <Box 
                  key={`group-${groupIdx}-${apt.id}`} 
                  sx={{ 
                    position: "absolute", top, left: `calc(${leftPct}% + 4px)`, 
                    width: `calc(${widthPct}% - 6px)`, height: `calc(${height} - 2px)`, zIndex: 1 + idx,
                    transition: "all 0.15s ease-in-out",
                    "&:hover": group.length > 1 ? {
                      zIndex: 50,
                      width: "calc(100% - 8px)",
                      left: "4px",
                    } : {}
                  }}
                >
                  <AppointmentCard 
                    appointment={apt}
                    showFullTags={false}
                    onClick={onAppointmentClick}
                    onMenuOpen={onMenuOpen}
                  />
                </Box>
              );
            });
          })}
        </Box>
      </Box>
      
      <OverlappingAppointmentsMenu
        anchorEl={overlapMenuAnchor}
        appointments={overlapMenuAppts}
        onClose={() => {
          setOverlapMenuAnchor(null);
          setOverlapMenuAppts([]);
        }}
        onSelect={onAppointmentClick}
      />
    </Box>
  );
}

// ---- Week View ----

interface WeekViewProps extends SharedProps {
  appointments: AppointmentResponse[];
  date: Date;
  startHour: number;
  endHour: number;
}

function WeekView({ appointments, date, startHour, endHour, onAppointmentClick, onMenuOpen, onDateClick }: WeekViewProps) {
  const [overlapMenuAnchor, setOverlapMenuAnchor] = useState<HTMLElement | null>(null);
  const [overlapMenuAppts, setOverlapMenuAppts] = useState<AppointmentResponse[]>([]);
  
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const weekStart = dayjs(date).startOf("week");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));
  const multiDay = appointments.filter((a) => isMultiDay(a));
  const allDayRows = layoutMultiDayRows(multiDay, days);

  return (
    <Box sx={{ bgcolor: "background.paper", overflow: "auto", border: "1px solid", borderColor: "grey.200", borderRadius: 3 }}>
      <Box sx={{ display: "flex", borderBottom: 1, borderColor: "grey.200" }}>
        <Box sx={{ width: TIME_GUTTER, flexShrink: 0 }} />
        {days.map((d, i) => (
          <DayHeader key={i} d={d} onClick={() => onDateClick?.(d.toDate())} />
        ))}
      </Box>

      {allDayRows.length > 0 && (
        <Box sx={{ display: "flex", borderBottom: 1, borderColor: "grey.200" }}>
          <Box sx={{ width: TIME_GUTTER, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1 }}>
            <Typography sx={{ fontSize: "0.65rem", color: "text.disabled", textAlign: "right" }}>Todo el<br/>día</Typography>
          </Box>
          <Box sx={{ flex: 1, position: "relative", minHeight: allDayRows.length * (ALL_DAY_ROW_H + 2) + 4, display: "flex" }}>
            {/* Background vertical grid lines to prevent visual cutting */}
            {days.map((_, i) => (
              <Box key={`bg-${i}`} sx={{ flex: 1, borderLeft: 1, borderColor: "grey.200" }} />
            ))}
            
            {/* Absolute events layer */}
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
                  <MultiDayBar appointment={item.apt} onClick={onAppointmentClick} onMenuOpen={onMenuOpen} />
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex" }}>
        <TimeGutter hours={hours} />
        {days.map((d, i) => {
          const dateStr = d.format("YYYY-MM-DD");
          const dayAppts = appointments.filter((a) => !isMultiDay(a) && overlapsDay(a, dateStr));
          const overlappingGroups = getOverlappingGroups(dayAppts);
          const isToday = d.isSame(dayjs(), "day");
          return (
            <Box
              key={i}
              sx={{
                flex: 1,
                position: "relative",
                borderLeft: 1,
                borderColor: "grey.200",
                minHeight: hours.length * HOUR_HEIGHT,
                bgcolor: isToday ? "rgba(26,115,232,0.04)" : "transparent",
              }}
            >
              {hours.map((h) => (
                <Box key={h} sx={{ height: HOUR_HEIGHT, borderBottom: 1, borderColor: "grey.200" }} />
              ))}
              {overlappingGroups.map((group, groupIdx) => {
                return group.map((apt, idx) => {
                  const { top, height } = getTopAndHeight(apt, dateStr, startHour, endHour);
                  const widthPct = 100 / group.length;
                  const leftPct = widthPct * idx;
                  return (
                    <Box 
                      key={`group-${dateStr}-${groupIdx}-${apt.id}`} 
                      sx={{ 
                        position: "absolute", top, left: `calc(${leftPct}% + 4px)`, 
                        width: `calc(${widthPct}% - 6px)`, height: `calc(${height} - 2px)`, zIndex: 1 + idx,
                        transition: "all 0.15s ease-in-out",
                        "&:hover": group.length > 1 ? {
                          zIndex: 50,
                          width: "calc(100% - 8px)",
                          left: "4px",
                        } : {}
                      }}
                    >
                      <AppointmentCard 
                        appointment={apt}
                        showFullTags={false}
                        onClick={onAppointmentClick}
                        onMenuOpen={onMenuOpen}
                      />
                    </Box>
                  );
                });
              })}
            </Box>
          );
        })}
      </Box>
      
      <OverlappingAppointmentsMenu
        anchorEl={overlapMenuAnchor}
        appointments={overlapMenuAppts}
        onClose={() => {
          setOverlapMenuAnchor(null);
          setOverlapMenuAppts([]);
        }}
        onSelect={onAppointmentClick}
      />
    </Box>
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

interface MonthViewProps extends SharedProps {
  appointments: AppointmentResponse[];
  date: Date;
}

function MonthView({ appointments, date, onAppointmentClick, onMenuOpen, onDateClick }: MonthViewProps) {
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
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "grey.200", borderRadius: 3 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: 1, borderColor: "grey.200" }}>
        {DAY_NAMES.map((name, i) => (
          <Box key={name} sx={{ textAlign: "center", py: 1, borderLeft: i > 0 ? 1 : 0, borderColor: "grey.200" }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 500, color: "text.disabled", letterSpacing: 0.5 }}>
              {name}
            </Typography>
          </Box>
        ))}
      </Box>

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
              borderColor: "grey.200",
              position: "relative",
            }}
          >
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
                  <MultiDayBar appointment={item.apt} onClick={onAppointmentClick} onMenuOpen={onMenuOpen} />
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
                    borderColor: "grey.200",
                    pt: 0.5,
                    px: 0.5,
                  }}
                >
                  <Typography
                    onClick={() => onDateClick?.(d.toDate())}
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
                      cursor: "pointer",
                      "&:hover": { bgcolor: isToday ? "primary.dark" : "action.hover" },
                    }}
                  >
                    {d.date()}
                  </Typography>

                  {multiH > 0 && <Box sx={{ height: multiH + 4 }} />}

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {daySingle.map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        variant="month"
                        showFullTags={false}
                        onClick={onAppointmentClick}
                        onMenuOpen={onMenuOpen}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
