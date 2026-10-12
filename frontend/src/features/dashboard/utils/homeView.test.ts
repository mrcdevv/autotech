import { describe, it, expect } from "vitest";

import { buildDailyCash, buildKpis } from "./homeView";

import type { DashboardSummaryResponse } from "../types";
import type { InvoiceResponse } from "@/types/invoice";
import type { AppointmentResponse } from "@/types/appointment";
import type { RepairOrderResponse } from "@/features/repair-orders/types";

// Intl es-AR emits a NON-BREAKING SPACE (U+00A0) after the "$" symbol and uses
// "." for thousands / "," for decimals. These literals pin the D3 policy: KPI hints
// and the "Caja del día" totals are money figures and carry exactly 2 decimals.
// 1234.5 discriminates the two formatters: formatCurrency -> "$ 1.234,50",
// formatCurrencyWhole -> "$ 1.235".
const summary: DashboardSummaryResponse = {
  openRepairOrderCount: 0,
  readyForPickupCount: 0,
  todayAppointmentCount: 0,
  pendingEstimateCount: 1,
  repairOrderStatusCounts: [],
  todayAppointments: [],
  readyForPickupOrders: [],
  staleOrderAlerts: [],
  pendingEstimateAlerts: [
    { estimateId: 1, clientFullName: "Juan Perez", vehiclePlate: "ABC123", total: 1234.5, daysPending: 3 },
  ],
  staleThresholdDays: 30,
};

const todayIso = () => new Date().toISOString();

const invoice = (id: number, status: InvoiceResponse["status"], total: number): InvoiceResponse => ({
  id,
  clientId: 1,
  clientFullName: "Juan Perez",
  vehicleId: null,
  vehiclePlate: null,
  vehicleModel: null,
  repairOrderId: null,
  estimateId: null,
  status,
  discountPercentage: 0,
  taxPercentage: 0,
  total,
  createdAt: todayIso(),
  updatedAt: todayIso(),
});

describe("buildKpis", () => {
  it("given a pending estimate total with cents, when built, then the KPI hint renders exactly 2 decimals", () => {
    const kpis = buildKpis(summary, [] as RepairOrderResponse[], [] as AppointmentResponse[]);

    const pending = kpis.find((kpi) => kpi.label === "Presup. sin respuesta");
    expect(pending).toBeDefined();
    expect(pending?.hint).toMatch(/^\$\u00A01\.234,50 esperando OK$/);
  });
});

describe("buildDailyCash", () => {
  it("given today's invoices with cents, when built, then the totals render exactly 2 decimals", () => {
    const cash = buildDailyCash([invoice(1, "PAGADA", 1234.5), invoice(2, "PENDIENTE", 226.8)]);

    expect(cash.total).toMatch(/^\$\u00A01\.234,50$/);
    expect(cash.pendingTotal).toMatch(/^\$\u00A0226,80$/);
  });
});
