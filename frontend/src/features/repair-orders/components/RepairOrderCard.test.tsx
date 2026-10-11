import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router";

import { RepairOrderCard } from "./RepairOrderCard";

import type { RepairOrderResponse } from "../types";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

const sampleOrder: RepairOrderResponse = {
  id: 1,
  title: "OT-1 Perez - ABC123",
  status: "INGRESO_VEHICULO",
  clientId: 1,
  clientFirstName: "Juan",
  clientLastName: "Perez",
  clientPhone: "1234567890",
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleBrandName: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
  employees: [{ id: 1, firstName: "Carlos", lastName: "Lopez" }],
  tags: [{ id: 1, name: "Urgente", color: "#FF0000" }],
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

describe("RepairOrderCard", () => {
  it("given order, when rendered, then shows status badge and order id", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ingreso")).toBeInTheDocument();
    expect(screen.getByText("OT-1")).toBeInTheDocument();
  });

  it("given order, when rendered, then shows client name and phone", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  it("given order, when rendered, then shows vehicle info", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/2020 Toyota Corolla/)).toBeInTheDocument();
    expect(screen.getAllByText(/ABC123/).length).toBeGreaterThan(0);
  });

  it("given order with employees, when rendered, then shows employee chips", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Carlos Lopez")).toBeInTheDocument();
  });

  it("given order with tags, when rendered, then shows tag chips", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("given card, when clicking card, then navigates to detail page", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("Juan Perez"));

    expect(mockNavigate).toHaveBeenCalledWith("/ordenes-trabajo/1");
  });

  it("given card, when clicking 3-dot menu, then shows copy tracking code option", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    const menuButton = screen.getByLabelText("Opciones de la orden");
    await user.click(menuButton);

    expect(screen.getByText("Copiar código de seguimiento")).toBeInTheDocument();
  });

  it("given card, when clicking 3-dot menu, then shows assign mechanic option", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText("Opciones de la orden"));

    expect(screen.getByText("Asignar mecánico")).toBeInTheDocument();
  });

  it("given card, when clicking update status button, then opens status dialog", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Actualizar estado" }));

    expect(screen.getByRole("radio", { name: "Reparación" })).toBeInTheDocument();
  });

  it("given card, when clicking view details button, then navigates to detail page", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Ver detalle" }));

    expect(mockNavigate).toHaveBeenCalledWith("/ordenes-trabajo/1");
  });
});
