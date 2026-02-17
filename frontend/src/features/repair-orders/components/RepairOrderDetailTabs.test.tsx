import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { RepairOrderDetailTabs } from "./RepairOrderDetailTabs";

import type { RepairOrderDetailResponse } from "../types";

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: () => <div data-testid="mock-datagrid" />,
}));

const sampleOrder: RepairOrderDetailResponse = {
  id: 1,
  title: "OT-1 Perez - ABC123",
  status: "INGRESO_VEHICULO",
  reason: "Engine noise",
  clientSource: null,
  mechanicNotes: null,
  appointmentId: null,
  clientId: 1,
  clientFirstName: "Juan",
  clientLastName: "Perez",
  clientDni: "12345678",
  clientPhone: "1234567890",
  clientEmail: "juan@test.com",
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleBrandName: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
  vehicleChassisNumber: "CHASSIS001",
  employees: [],
  tags: [],
  workHistory: [],
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

describe("RepairOrderDetailTabs", () => {
  it("given order, when rendered, then shows 5 tab labels", () => {
    render(<RepairOrderDetailTabs order={sampleOrder} loading={false} />);

    expect(screen.getByText("Información General")).toBeInTheDocument();
    expect(screen.getByText("Inspecciones")).toBeInTheDocument();
    expect(screen.getByText("Presupuesto")).toBeInTheDocument();
    expect(screen.getByText("Trabajos")).toBeInTheDocument();
    expect(screen.getByText("Factura")).toBeInTheDocument();
  });

  it("given order, when first tab active, then shows GeneralInfoTab content", () => {
    render(<RepairOrderDetailTabs order={sampleOrder} loading={false} />);

    expect(screen.getByText("Datos del Cliente")).toBeInTheDocument();
    expect(screen.getByText("Datos del Vehículo")).toBeInTheDocument();
  });

  it("given order, when clicking Inspecciones tab, then shows Próximamente", async () => {
    const user = userEvent.setup();
    render(<RepairOrderDetailTabs order={sampleOrder} loading={false} />);

    await user.click(screen.getByText("Inspecciones"));

    expect(screen.getByText("Próximamente")).toBeInTheDocument();
  });

  it("given order, when clicking Presupuesto tab, then shows Próximamente", async () => {
    const user = userEvent.setup();
    render(<RepairOrderDetailTabs order={sampleOrder} loading={false} />);

    await user.click(screen.getByText("Presupuesto"));

    expect(screen.getByText("Próximamente")).toBeInTheDocument();
  });
});
