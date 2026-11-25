import dayjs from "dayjs";

import { formatCurrency } from "@/utils/formatCurrency";

import { MONTH_NAMES, buildMonthlyBillingBuckets } from "./reportPeriod";

import type { Dayjs } from "dayjs";
import type { DashboardReportsResponse } from "@/features/dashboard/types";

const MAX_INSIGHTS = 4;
/** A month billed at least this many times the previous one is worth pointing out. */
const GROWTH_RATIO = 1.5;
const DROP_RATIO = 0.67;
/** Share of a month's billing still unpaid that deserves attention. */
const PENDING_SHARE_ALERT = 0.3;
const LOW_CONVERSION = 0.5;

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}

function formatRatio(ratio: number): string {
  return ratio.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Short sentences that point out what needs attention in the period, computed
 * only from the report data (never estimated). At most four, most relevant first.
 */
export function buildReportInsights(
  data: DashboardReportsResponse,
  from: string,
  to: string,
  today: Dayjs = dayjs()
): string[] {
  const insights: string[] = [];

  // Latest month of the period that has already started.
  const buckets = buildMonthlyBillingBuckets(data.monthlyBilling, from, to).filter(
    (bucket) => !dayjs(`${bucket.year}-${bucket.month}-01`).isAfter(today, "month")
  );
  const latest = buckets.at(-1);
  const previous = buckets.at(-2);

  if (latest && latest.billed > 0) {
    const monthName = MONTH_NAMES[latest.month - 1] ?? "";
    const isCurrentMonth = today.year() === latest.year && today.month() + 1 === latest.month;
    const verb = isCurrentMonth ? "lleva facturado" : "facturó";

    if (previous && previous.billed > 0) {
      const ratio = latest.billed / previous.billed;
      const previousName = MONTH_NAMES[previous.month - 1] ?? "";
      if (ratio >= GROWTH_RATIO) {
        insights.push(
          `${capitalize(monthName)} ${verb} ${formatCurrency(latest.billed)}, ` +
            `${formatRatio(ratio)} veces lo de ${previousName}.`
        );
      } else if (ratio <= DROP_RATIO) {
        insights.push(
          `${capitalize(monthName)} ${verb} ${formatCurrency(latest.billed)}, ` +
            `un ${formatPercent(1 - ratio)} menos que ${previousName}.`
        );
      }
    }

    const pendingShare = (latest.billed - latest.collected) / latest.billed;
    if (pendingShare >= PENDING_SHARE_ALERT) {
      insights.push(
        `El ${formatPercent(pendingShare)} de lo facturado en ${monthName} todavía no se cobró.`
      );
    }
  }

  const overdue = data.debtAging.find((bucket) => bucket.range === "90+");
  if (overdue && overdue.deliveryNoteCount > 0) {
    const plural = overdue.deliveryNoteCount === 1;
    insights.push(
      `${overdue.deliveryNoteCount} ${plural ? "remito lleva" : "remitos llevan"} ` +
        `más de 90 días sin pagar (${formatCurrency(overdue.totalAmount)}).`
    );
  }

  const { estimatesTotal, estimatesAccepted } = data.kpis;
  if (estimatesTotal > 0) {
    const low = estimatesAccepted / estimatesTotal < LOW_CONVERSION;
    const verb = estimatesAccepted === 1 ? "se aprobó" : "se aprobaron";
    const sentence = `${verb} ${estimatesAccepted} de ${estimatesTotal} presupuestos del período.`;
    insights.push(low ? `Solo ${sentence}` : capitalize(sentence));
  }

  return insights.slice(0, MAX_INSIGHTS);
}

/**
 * "+15 % vs. período anterior" style comparison, or null when the previous
 * period has nothing to compare against.
 */
export function describeChange(current: number, previous: number): string | null {
  if (previous <= 0) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return "igual que el período anterior";
  return `${change > 0 ? "+" : "−"}${Math.abs(change)} % vs. período anterior`;
}
