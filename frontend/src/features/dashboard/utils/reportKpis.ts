import { formatCurrency } from "@/utils/formatCurrency";
import { status } from "@/theme/tokens";

import { describeChange } from "./reportInsights";

import type { KpiView } from "./homeView";
import type { ReportKpisResponse } from "@/features/dashboard/types";

function percentOf(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)} %` : "—";
}

function withChange(hint: string, current: number, previous: number | undefined): string {
  if (previous === undefined) return hint;
  const change = describeChange(current, previous);
  return change ? `${hint} · ${change}` : hint;
}

/** Headline cards of the reports page; `previous` adds the comparison with the prior period. */
export function buildReportKpis(
  kpis: ReportKpisResponse,
  previous?: ReportKpisResponse | null
): KpiView[] {
  const prev = previous ?? undefined;
  const notes = kpis.deliveryNoteCount === 1 ? "remito emitido" : "remitos emitidos";
  const unpaid = kpis.pendingDeliveryNoteCount === 1 ? "remito sin cobrar" : "remitos sin cobrar";

  return [
    {
      label: "Facturado",
      value: formatCurrency(kpis.totalBilled),
      hint: withChange(`${kpis.deliveryNoteCount} ${notes}`, kpis.totalBilled, prev?.totalBilled),
      valueColor: "text.primary",
    },
    {
      label: "Cobrado",
      value: formatCurrency(kpis.totalCollected),
      hint: withChange(
        `${percentOf(kpis.totalCollected, kpis.totalBilled)} de lo facturado`,
        kpis.totalCollected,
        prev?.totalCollected
      ),
      valueColor: "text.primary",
    },
    {
      label: "Pendiente de cobro",
      value: formatCurrency(kpis.totalPending),
      hint: `${kpis.pendingDeliveryNoteCount} ${unpaid}`,
      valueColor: kpis.totalPending > 0 ? status.parts.fg : "text.primary",
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(kpis.averageTicket),
      hint: withChange("por remito", kpis.averageTicket, prev?.averageTicket),
      valueColor: "text.primary",
    },
    {
      label: "Presupuestos aceptados",
      value: percentOf(kpis.estimatesAccepted, kpis.estimatesTotal),
      hint: `${kpis.estimatesAccepted} de ${kpis.estimatesTotal} presupuestos`,
      valueColor: "text.primary",
    },
    {
      label: "Órdenes de trabajo",
      value: String(kpis.repairOrderCount),
      hint: withChange("ingresadas en el período", kpis.repairOrderCount, prev?.repairOrderCount),
      valueColor: "text.primary",
    },
  ];
}
