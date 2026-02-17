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
  it("given order, when rendered, then shows client data as readonly", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} />);

    expect(screen.getByDisplayValue("Juan Perez")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12345678")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1234567890")).toBeInTheDocument();
    expect(screen.getByDisplayValue("juan@test.com")).toBeInTheDocument();
  });

  it("given order, when rendered, then shows vehicle data as readonly", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} />);

    expect(screen.getByDisplayValue("2020 Toyota Corolla")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ABC123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CHASSIS001")).toBeInTheDocument();
  });

  it("given order, when rendered, then shows work history section", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} />);

    expect(screen.getByText("Historial de Trabajo")).toBeInTheDocument();
    expect(screen.getByTestId("mock-datagrid")).toBeInTheDocument();
  });

  it("given null order, when rendered, then shows not found message", () => {
    render(<GeneralInfoTab order={null} loading={false} />);

    expect(screen.getByText("No se encontró la orden de trabajo")).toBeInTheDocument();
  });

  it("given loading state, when rendered, then shows spinner", () => {
    const { container } = render(<GeneralInfoTab order={null} loading={true} />);

    expect(container.querySelector(".MuiCircularProgress-root")).toBeInTheDocument();
  });
});
