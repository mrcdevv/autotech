import dayjs from "dayjs";

import type { Dayjs } from "dayjs";
import type { CalendarViewMode } from "@/types/appointment";

/**
 * Start (00:00) of the Monday-based week containing the given date.
 * Locale-independent so the fetched range and the rendered grid always agree.
 */
export function getWeekStart(date: Date | Dayjs): Dayjs {
  const d = dayjs(date).startOf("day");
  const daysSinceMonday = (d.day() + 6) % 7; // Sunday (0) -> 6, Monday (1) -> 0
  return d.subtract(daysSinceMonday, "day");
}

export function getDateRange(date: Date, mode: CalendarViewMode): { start: Date; end: Date } {
  const d = new Date(date);
  switch (mode) {
    case "day": {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
      return { start, end };
    }
    case "week": {
      const weekStart = getWeekStart(d);
      return { start: weekStart.toDate(), end: weekStart.add(7, "day").toDate() };
    }
    case "month": {
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0);
      return { start, end };
    }
  }
}
