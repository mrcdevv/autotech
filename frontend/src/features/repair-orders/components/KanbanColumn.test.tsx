import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router";

import { KanbanColumn } from "./KanbanColumn";

import type { RepairOrderResponse } from "../types";

const mockOrder = (id: number, createdAt: string): RepairOrderResponse => ({
  id,
  title: `OT-${id}`,
  status: "INGRESO_VEHICULO",
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
  createdAt,
  updatedAt: createdAt,
});

describe("KanbanColumn", () => {
  it("given column with orders, when rendered, then shows title and count", () => {
    const orders = [mockOrder(1, "2025-01-01T10:00:00"), mockOrder(2, "2025-01-02T10:00:00")];

    render(
      <MemoryRouter>
        <KanbanColumn title="Presupuesto" orders={orders} loading={false} onUpdateStatus={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Presupuesto")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("given empty column, when rendered, then shows Sin órdenes message", () => {
    render(
      <MemoryRouter>
        <KanbanColumn title="Completada" orders={[]} loading={false} onUpdateStatus={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sin órdenes")).toBeInTheDocument();
  });

  it("given loading state, when rendered, then shows skeleton placeholders", () => {
    const { container } = render(
      <MemoryRouter>
        <KanbanColumn title="Test" orders={[]} loading={true} onUpdateStatus={vi.fn()} />
      </MemoryRouter>,
    );

    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBe(3);
  });
});
