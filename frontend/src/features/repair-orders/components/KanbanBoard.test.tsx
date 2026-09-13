import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router";

import { KanbanBoard } from "./KanbanBoard";

import type { RepairOrderResponse } from "../types";

const mockOrder = (id: number, status: RepairOrderResponse["status"]): RepairOrderResponse => ({
  id,
  title: `OT-${id} Test`,
  status,
  clientId: 1,
  clientFirstName: "Juan",
  clientLastName: "Perez",
  clientPhone: "123456",
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleBrandName: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
  employees: [],
  tags: [],
  createdAt: "2025-01-01T10:00:00",
  updatedAt: "2025-01-01T10:00:00",
});

describe("KanbanBoard", () => {
  it("given orders, when rendered, then shows 3 columns with correct titles", () => {
    render(
      <MemoryRouter>
        <KanbanBoard orders={[]} loading={false} onUpdateStatus={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Presupuesto")).toBeInTheDocument();
    expect(screen.getByText("Trabajo en proceso")).toBeInTheDocument();
    expect(screen.getByText("Completada")).toBeInTheDocument();
  });

  it("given orders with different statuses, when rendered, then groups them into correct columns", () => {
    const orders = [
      mockOrder(1, "INGRESO_VEHICULO"),
      mockOrder(2, "REPARACION"),
      mockOrder(3, "ENTREGADO"),
    ];

    render(
      <MemoryRouter>
        <KanbanBoard orders={orders} loading={false} onUpdateStatus={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("OT-1")).toBeInTheDocument();
    expect(screen.getByText("OT-2")).toBeInTheDocument();
    expect(screen.getByText("OT-3")).toBeInTheDocument();
  });

  it("given loading state, when rendered, then shows loading placeholders", () => {
    const { container } = render(
      <MemoryRouter>
        <KanbanBoard orders={[]} loading={true} onUpdateStatus={vi.fn()} />
      </MemoryRouter>,
    );

    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
