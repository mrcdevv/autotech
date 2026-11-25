import dayjs from "dayjs";
import { describe, it, expect } from "vitest";

import { formatCurrency } from "@/utils/formatCurrency";

import { buildReportInsights, describeChange } from "./reportInsights";

import type { DashboardReportsResponse } from "@/features/dashboard/types";

const TODAY = dayjs("2026-11-24");

function makeData(overrides: Partial<DashboardReportsResponse> = {}): DashboardReportsResponse {
  return {
    kpis: {
      totalBilled: 0,
      totalCollected: 0,
      totalPending: 0,
      deliveryNoteCount: 0,
      pendingDeliveryNoteCount: 0,
      averageTicket: 0,
      estimatesTotal: 0,
      estimatesAccepted: 0,
      repairOrderCount: 0,
    },
    monthlyBilling: [],
    services: [],
    brandCounts: [],
    debtAging: [
      { range: "0-30", deliveryNoteCount: 0, totalAmount: 0 },
      { range: "31-60", deliveryNoteCount: 0, totalAmount: 0 },
      { range: "61-90", deliveryNoteCount: 0, totalAmount: 0 },
      { range: "90+", deliveryNoteCount: 0, totalAmount: 0 },
    ],
    unpaidDeliveryNotes: [],
    mechanicProductivity: [],
    averageRepairDays: 0,
    ...overrides,
  };
}

describe("buildReportInsights", () => {
  it("given current month billed over twice the previous one, when building, then reports the growth", () => {
    const data = makeData({
      monthlyBilling: [
        { year: 2026, month: 10, billed: 100000, collected: 100000 },
        { year: 2026, month: 11, billed: 220000, collected: 220000 },
      ],
    });

    const insights = buildReportInsights(data, "2026-01-01", "2026-12-31", TODAY);

    expect(insights).toEqual([
      `Noviembre lleva facturado ${formatCurrency(220000)}, 2,2 veces lo de octubre.`,
    ]);
  });

  it("given a past month that dropped, when building, then reports the drop with the past tense", () => {
    const data = makeData({
      monthlyBilling: [
        { year: 2026, month: 5, billed: 100000, collected: 100000 },
        { year: 2026, month: 6, billed: 40000, collected: 40000 },
      ],
    });

    const insights = buildReportInsights(data, "2026-05-01", "2026-06-30", TODAY);

    expect(insights).toEqual([
      `Junio facturó ${formatCurrency(40000)}, un 60 % menos que mayo.`,
    ]);
  });

  it("given most of the latest month unpaid, when building, then reports the pending share", () => {
    const data = makeData({
      monthlyBilling: [{ year: 2026, month: 11, billed: 1000, collected: 430 }],
    });

    const insights = buildReportInsights(data, "2026-11-01", "2026-11-30", TODAY);

    expect(insights).toContain("El 57 % de lo facturado en noviembre todavía no se cobró.");
  });

  it("given delivery notes unpaid for over 90 days, when building, then reports them", () => {
    const data = makeData({
      debtAging: [
        { range: "0-30", deliveryNoteCount: 0, totalAmount: 0 },
        { range: "31-60", deliveryNoteCount: 0, totalAmount: 0 },
        { range: "61-90", deliveryNoteCount: 0, totalAmount: 0 },
        { range: "90+", deliveryNoteCount: 2, totalAmount: 60500 },
      ],
    });

    const insights = buildReportInsights(data, "2026-11-01", "2026-11-30", TODAY);

    expect(insights).toEqual([
      `2 remitos llevan más de 90 días sin pagar (${formatCurrency(60500)}).`,
    ]);
  });

  it("given low estimate approval, when building, then says only a few were approved", () => {
    const data = makeData({
      kpis: { ...makeData().kpis, estimatesTotal: 4, estimatesAccepted: 1 },
    });

    const insights = buildReportInsights(data, "2026-11-01", "2026-11-30", TODAY);

    expect(insights).toEqual(["Solo se aprobó 1 de 4 presupuestos del período."]);
  });

  it("given future months in the period, when building, then compares the latest started month", () => {
    const data = makeData({
      monthlyBilling: [
        { year: 2026, month: 10, billed: 100000, collected: 100000 },
        { year: 2026, month: 11, billed: 300000, collected: 300000 },
      ],
    });

    const insights = buildReportInsights(data, "2026-10-01", "2026-12-31", TODAY);

    expect(insights[0]).toMatch(/^Noviembre lleva facturado/);
  });

  it("given nothing remarkable, when building, then returns no insights", () => {
    expect(buildReportInsights(makeData(), "2026-11-01", "2026-11-30", TODAY)).toEqual([]);
  });
});

describe("describeChange", () => {
  it("given growth, when describing, then returns a signed percentage", () => {
    expect(describeChange(115, 100)).toBe("+15 % vs. período anterior");
  });

  it("given a drop, when describing, then returns a negative percentage", () => {
    expect(describeChange(50, 200)).toBe("−75 % vs. período anterior");
  });

  it("given no previous value, when describing, then returns null", () => {
    expect(describeChange(100, 0)).toBeNull();
  });
});
