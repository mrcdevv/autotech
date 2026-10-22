import { describe, it, expect } from "vitest";

import { buildDailyCash, buildKpis, buildWorkshopCarousel } from "./homeView";
import { STATUS_META } from "@/features/repair-orders/statusMeta";
import { dot } from "@/theme/tokens";

import type { DashboardSummaryResponse } from "../types";
import type { DeliveryNoteResponse } from "@/types/deliveryNote";
import type { AppointmentResponse } from "@/types/appointment";
import type { RepairOrderResponse } from "@/features/repair-orders/types";

const baseOrder: RepairOrderResponse = {
  id: 12,
  title: "Cambio de aceite",
  status: "REPARACION",
  clientId: 1,
  clientFirstName: "Juan",
  clientLastName: "Perez",
  clientPhone: "3510000000",
  vehicleId: 1,
  vehiclePlate: "AB123CD",
  vehicleBrandName: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
  employees: [],
  tags: [],
  createdAt: "2026-02-01T10:00:00Z",
  updatedAt: "2026-02-02T10:00:00Z",
};

describe("buildWorkshopCarousel", () => {
  it("given an order with three mechanics, then builds one entry per mechanic with initials and full name", () => {
    const order: RepairOrderResponse = {
      ...baseOrder,
      employees: [
        { id: 1, firstName: "Carlos", lastName: "Lopez" },
        { id: 2, firstName: "Ana", lastName: "Garcia" },
        { id: 3, firstName: "Bruno", lastName: "Diaz" },
      ],
    };

    const items = buildWorkshopCarousel([order]);
    expect(items).toHaveLength(1);
    const item = items[0]!;

    expect(item.mechanics).toEqual([
      { id: 1, initials: "CL", fullName: "Carlos Lopez" },
      { id: 2, initials: "AG", fullName: "Ana Garcia" },
      { id: 3, initials: "BD", fullName: "Bruno Diaz" },
    ]);
  });

  it("given an order with no mechanics, then builds an empty mechanic list", () => {
    const order: RepairOrderResponse = { ...baseOrder, employees: [] };

    const items = buildWorkshopCarousel([order]);
    expect(items).toHaveLength(1);
    const item = items[0]!;

    expect(item.mechanics).toEqual([]);
  });

  it("given a known order, then keeps every other item field unchanged", () => {
    const order: RepairOrderResponse = {
      ...baseOrder,
      employees: [{ id: 1, firstName: "Carlos", lastName: "Lopez" }],
    };
    const meta = STATUS_META.REPARACION;

    const items = buildWorkshopCarousel([order]);
    expect(items).toHaveLength(1);
    const item = items[0]!;

    expect(item).toEqual({
      id: 12,
      position: 1,
      puesto: "Puesto 1",
      ot: "OT-12",
      plate: "AB123CD",
      vehicle: "Toyota Corolla 2020",
      client: "Juan Perez",
      task: "Cambio de aceite",
      statusLabel: meta.label,
      tone: meta.tone,
      color: meta.color,
      progress: meta.progress,
      mechanics: [{ id: 1, initials: "CL", fullName: "Carlos Lopez" }],
    });
    expect(item.statusLabel).toBe("Reparación");
    expect(dot.info).toBeTruthy();
  });
});

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
  lowStockAlerts: [],
};

const todayIso = () => new Date().toISOString();

const deliveryNote = (id: number, status: DeliveryNoteResponse["status"], total: number): DeliveryNoteResponse => ({
  id,
  number: id,
  clientId: 1,
  clientFullName: "Juan Perez",
  vehicleId: null,
  vehiclePlate: null,
  vehicleModel: null,
  repairOrderId: null,
  estimateId: null,
  status,
  discountPercentage: 0,
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
    const cash = buildDailyCash([deliveryNote(1, "PAGADA", 1234.5), deliveryNote(2, "PENDIENTE", 226.8)]);

    expect(cash.total).toMatch(/^\$\u00A01\.234,50$/);
    expect(cash.pendingTotal).toMatch(/^\$\u00A0226,80$/);
  });
});
