import dayjs from "dayjs";

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
  { value: "last3", label: "Últimos 3 meses" },
  { value: "last6", label: "Últimos 6 meses" },
  { value: "thisYear", label: "Este año" },
  { value: "custom", label: "Personalizado" },
];

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
        from: today.startOf("month").format("YYYY-MM-DD"),
        to: today.endOf("month").format("YYYY-MM-DD"),
      };
    case "last3":
      return {
        preset,
        from: today.subtract(2, "month").startOf("month").format("YYYY-MM-DD"),
        to: today.endOf("month").format("YYYY-MM-DD"),
      };
    case "last6":
      return {
        preset,
        from: today.subtract(5, "month").startOf("month").format("YYYY-MM-DD"),
        to: today.endOf("month").format("YYYY-MM-DD"),
      };
    case "thisYear":
      return {
        preset,
        from: today.startOf("year").format("YYYY-MM-DD"),
        to: today.endOf("year").format("YYYY-MM-DD"),
      };
    case "custom":
    default:
      return { preset, from: customFrom, to: customTo };
  }
}

export const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export interface MonthlyBillingPoint {
  year: number;
  month: number;
  total: number;
}

export function buildMonthlyBillingBuckets(
  data: { year: number; month: number; total: number }[],
  from: string,
  to: string
): MonthlyBillingPoint[] {
  const totalsByMonth = new Map(
    data.map((item) => [`${item.year}-${item.month}`, item.total])
  );

  const start = dayjs(from).startOf("month");
  const end = dayjs(to).startOf("month");
  const months = end.diff(start, "month") + 1;

  return Array.from({ length: Math.max(months, 0) }, (_, index) => {
    const date = start.add(index, "month");
    const year = date.year();
    const month = date.month() + 1;
    return {
      year,
      month,
      total: totalsByMonth.get(`${year}-${month}`) ?? 0,
    };
  });
}
