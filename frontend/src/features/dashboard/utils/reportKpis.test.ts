import { describe, it, expect } from "vitest";

import { formatCurrency } from "@/utils/formatCurrency";

import { buildReportKpis } from "./reportKpis";

import type { ReportKpisResponse } from "@/features/dashboard/types";

const KPIS: ReportKpisResponse = {
  totalBilled: 1000,
  totalCollected: 705,
  totalPending: 295,
  deliveryNoteCount: 20,
  pendingDeliveryNoteCount: 7,
  averageTicket: 50,
  estimatesTotal: 4,
  estimatesAccepted: 1,
  repairOrderCount: 24,
};

describe("buildReportKpis", () => {
  it("given period figures, when building, then formats amounts and shares", () => {
    const cards = buildReportKpis(KPIS);

    expect(cards.map((card) => card.label)).toEqual([
      "Facturado",
      "Cobrado",
      "Pendiente de cobro",
      "Ticket promedio",
      "Presupuestos aceptados",
      "Órdenes de trabajo",
    ]);
    expect(cards[0]).toMatchObject({ value: formatCurrency(1000), hint: "20 remitos emitidos" });
    expect(cards[1]?.hint).toBe("71 % de lo facturado");
    expect(cards[2]?.hint).toBe("7 remitos sin cobrar");
    expect(cards[4]).toMatchObject({ value: "25 %", hint: "1 de 4 presupuestos" });
  });

  it("given no estimates, when building, then shows a dash instead of a percentage", () => {
    const cards = buildReportKpis({ ...KPIS, estimatesTotal: 0, estimatesAccepted: 0 });

    expect(cards[4]?.value).toBe("—");
  });

  it("given the previous period, when building, then appends the change to the hint", () => {
    const cards = buildReportKpis(KPIS, { ...KPIS, totalBilled: 800, repairOrderCount: 0 });

    expect(cards[0]?.hint).toBe("20 remitos emitidos · +25 % vs. período anterior");
    expect(cards[5]?.hint).toBe("ingresadas en el período");
  });
});
