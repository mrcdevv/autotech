import { render, screen, waitFor } from "@testing-library/react";
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

const multiMechanicOrder: RepairOrderResponse = {
  ...sampleOrder,
  employees: [
    { id: 1, firstName: "Carlos", lastName: "Lopez" },
    { id: 2, firstName: "Ana", lastName: "Garcia" },
    { id: 3, firstName: "Luis", lastName: "Martinez" },
  ],
};

const unassignedOrder: RepairOrderResponse = {
  ...sampleOrder,
  employees: [],
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

  it("given order with one mechanic, when rendered, then shows initials avatar and reveals the full name on hover", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("CL")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Lopez")).not.toBeInTheDocument();

    await user.hover(screen.getByText("CL"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Carlos Lopez");
  });

  it("given order with three mechanics, when rendered, then shows one initials avatar per mechanic and no visible full name", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={multiMechanicOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("CL")).toBeInTheDocument();
    expect(screen.getByText("AG")).toBeInTheDocument();
    expect(screen.getByText("LM")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Lopez")).not.toBeInTheDocument();
    expect(screen.queryByText("Ana Garcia")).not.toBeInTheDocument();
    expect(screen.queryByText("Luis Martinez")).not.toBeInTheDocument();
  });

  it("given order with three mechanics, when hovering each avatar, then each tooltip reveals its own mechanic", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RepairOrderCard order={multiMechanicOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    await user.hover(screen.getByText("CL"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Carlos Lopez");

    await user.unhover(screen.getByText("CL"));
    await waitFor(() => expect(screen.queryByText("Carlos Lopez")).not.toBeInTheDocument());

    await user.hover(screen.getByText("AG"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Ana Garcia");

    await user.unhover(screen.getByText("AG"));
    await waitFor(() => expect(screen.queryByText("Ana Garcia")).not.toBeInTheDocument());

    await user.hover(screen.getByText("LM"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Luis Martinez");
  });

  it("given order with three mechanics, when rendered, then row label reads Mecánicos", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={multiMechanicOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Mecánicos")).toBeInTheDocument();
  });

  it("given order with one mechanic, when rendered, then row label reads Mecánico", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Mecánico")).toBeInTheDocument();
    expect(screen.queryByText("Mecánicos")).not.toBeInTheDocument();
  });

  it("given order with no mechanics, when rendered, then shows Sin asignar and no mechanic", () => {
    render(
      <MemoryRouter>
        <RepairOrderCard order={unassignedOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Lopez")).not.toBeInTheDocument();
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

  it("given card, when clicking copy tracking code, then writes the OT-<id> identifier to the clipboard", async () => {
    // userEvent.setup() installs its own navigator.clipboard, so the mock must be
    // defined after setup to remain visible to the component.
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(
      <MemoryRouter>
        <RepairOrderCard order={sampleOrder} onUpdateStatus={vi.fn()} onRefetch={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText("Opciones de la orden"));
    await user.click(await screen.findByText("Copiar código de seguimiento"));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("OT-1");
    expect(writeText).not.toHaveBeenCalledWith("1");
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
