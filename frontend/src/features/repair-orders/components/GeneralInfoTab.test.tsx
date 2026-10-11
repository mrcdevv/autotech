import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { GeneralInfoTab } from "./GeneralInfoTab";

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
  workHistory: [
    { repairOrderId: 1, repairOrderTitle: "OT-1", reason: "Engine noise", createdAt: "2025-01-15T10:00:00" },
  ],
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

describe("GeneralInfoTab", () => {
  it("given order, when rendered, then shows status and reason", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("Ingreso")).toBeInTheDocument();
    expect(screen.getByText("Engine noise")).toBeInTheDocument();
  });

  it("given order, when rendered, then shows summary and notes sections", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("Resumen Financiero")).toBeInTheDocument();
    expect(screen.getByText("Motivo y Notas")).toBeInTheDocument();
  });

  it("given order, when rendered, then shows work history section", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("Historial de Trabajo")).toBeInTheDocument();
    expect(screen.getByTestId("mock-datagrid")).toBeInTheDocument();
  });

  it("given order without employees, when rendered, then shows assign action", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /asignar/i })).toBeInTheDocument();
  });

  it("given order with employees, when rendered, then shows edit action", () => {
    render(
      <GeneralInfoTab
        order={{ ...sampleOrder, employees: [{ id: 1, firstName: "Carlos", lastName: "Lopez" }] }}
        loading={false}
        onRefetch={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });

  it("given null order, when rendered, then shows not found message", () => {
    render(<GeneralInfoTab order={null} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("No se encontró la orden de trabajo")).toBeInTheDocument();
  });

  it("given loading state, when rendered, then shows spinner", () => {
    const { container } = render(<GeneralInfoTab order={null} loading={true} onRefetch={vi.fn()} />);

    expect(container.querySelector(".MuiCircularProgress-root")).toBeInTheDocument();
  });
});
