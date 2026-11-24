import dayjs from "dayjs";

import type { MonthlyBillingResponse } from "@/features/dashboard/types";

export type ReportPeriodPreset =
  | "thisMonth"
  | "last3"
  | "last6"
  | "thisYear"
  | "custom";

export interface ReportPeriod {
  preset: ReportPeriodPreset;
  from: string;
  to: string;
}

export const REPORT_PERIOD_OPTIONS: { value: ReportPeriodPreset; label: string }[] = [
  { value: "thisMonth", label: "Este mes" },
  { value: "last3", label: "3 meses" },
  { value: "last6", label: "6 meses" },
  { value: "thisYear", label: "Este año" },
  { value: "custom", label: "Personalizado" },
];

const DATE_FORMAT = "YYYY-MM-DD";

export function resolvePeriod(
  preset: ReportPeriodPreset,
  customFrom: string,
  customTo: string
): ReportPeriod {
  const today = dayjs();

  switch (preset) {
    case "thisMonth":
      return {
        preset,
        from: today.startOf("month").format(DATE_FORMAT),
        to: today.endOf("month").format(DATE_FORMAT),
      };
    case "last3":
      return {
        preset,
        from: today.subtract(2, "month").startOf("month").format(DATE_FORMAT),
        to: today.endOf("month").format(DATE_FORMAT),
      };
    case "last6":
      return {
        preset,
        from: today.subtract(5, "month").startOf("month").format(DATE_FORMAT),
        to: today.endOf("month").format(DATE_FORMAT),
      };
    case "thisYear":
      return {
        preset,
        from: today.startOf("year").format(DATE_FORMAT),
        to: today.endOf("year").format(DATE_FORMAT),
      };
    case "custom":
    default:
      return { preset, from: customFrom, to: customTo };
  }
}

/**
 * The period right before `from`–`to`, used to compare figures. Whole calendar
 * months shift by months (October is compared with September, not with the last
 * 31 days); any other range shifts by its length in days.
 */
export function resolvePreviousPeriod(from: string, to: string): { from: string; to: string } {
  const start = dayjs(from);
  const end = dayjs(to);
  const isWholeMonths =
    start.isSame(start.startOf("month"), "day") && end.isSame(end.endOf("month"), "day");

  if (isWholeMonths) {
    const months = end.diff(start, "month") + 1;
    const previousStart = start.subtract(months, "month");
    return {
      from: previousStart.format(DATE_FORMAT),
      to: start.subtract(1, "day").format(DATE_FORMAT),
    };
  }

  const days = end.diff(start, "day") + 1;
  return {
    from: start.subtract(days, "day").format(DATE_FORMAT),
    to: start.subtract(1, "day").format(DATE_FORMAT),
  };
}

export const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** One bucket per calendar month of the period, months without delivery notes at zero. */
export function buildMonthlyBillingBuckets(
  data: MonthlyBillingResponse[],
  from: string,
  to: string
): MonthlyBillingResponse[] {
  const byMonth = new Map(data.map((item) => [`${item.year}-${item.month}`, item]));

  const start = dayjs(from).startOf("month");
  const end = dayjs(to).startOf("month");
  const months = end.diff(start, "month") + 1;

  return Array.from({ length: Math.max(months, 0) }, (_, index) => {
    const date = start.add(index, "month");
    const year = date.year();
    const month = date.month() + 1;
    const found = byMonth.get(`${year}-${month}`);
    return {
      year,
      month,
      billed: found?.billed ?? 0,
      collected: found?.collected ?? 0,
    };
  });
}
