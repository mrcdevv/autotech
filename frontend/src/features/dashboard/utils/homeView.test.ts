import { describe, expect, it } from "vitest";

import { buildWorkshopCarousel } from "./homeView";
import { STATUS_META } from "@/features/repair-orders/statusMeta";
import { dot } from "@/theme/tokens";
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
