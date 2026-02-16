import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { VehicleList } from "./VehicleList";

import type { VehicleResponse } from "@/types/vehicle";

const mockRows: VehicleResponse[] = [
  {
    id: 1,
    clientId: 1,
    clientFirstName: "Juan",
    clientLastName: "Perez",
    clientDni: "12345678",
    plate: "ABC123",
    chassisNumber: "CH001",
    engineNumber: "EN001",
    brandId: 1,
    brandName: "Toyota",
    model: "Corolla",
    year: 2020,
    vehicleTypeId: 1,
    vehicleTypeName: "AUTO",
    observations: null,
    inRepair: false,
    createdAt: "",
  },
  {
    id: 2,
    clientId: 2,
    clientFirstName: "Maria",
    clientLastName: "Garcia",
    clientDni: null,
    plate: "XYZ789",
    chassisNumber: null,
    engineNumber: null,
    brandId: null,
    brandName: null,
    model: null,
    year: null,
    vehicleTypeId: null,
    vehicleTypeName: null,
    observations: null,
    inRepair: true,
    createdAt: "",
  },
];

const defaultProps = {
  rows: mockRows,
  loading: false,
  totalCount: 2,
  page: 0,
  pageSize: 12,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  onEditRow: vi.fn(),
  onDeleteRow: vi.fn(),
  onViewRow: vi.fn(),
};

describe("VehicleList", () => {
  it("given rows, when rendered, then shows column headers and data", () => {
    render(<VehicleList {...defaultProps} />);

    expect(screen.getByText("Patente")).toBeInTheDocument();
    expect(screen.getByText("Modelo")).toBeInTheDocument();
    expect(screen.getByText("Propietario")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("XYZ789")).toBeInTheDocument();
  });

  it("given loading state, when rendered, then shows loading overlay", () => {
    render(<VehicleList {...defaultProps} loading={true} rows={[]} totalCount={0} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("given row with edit button, when clicking edit, then calls onEditRow", async () => {
    const user = userEvent.setup();
    const onEditRow = vi.fn();
    render(<VehicleList {...defaultProps} onEditRow={onEditRow} />);

    const editButton = screen.getAllByRole("menuitem", { name: /editar/i })[0]!;
    await user.click(editButton);

    expect(onEditRow).toHaveBeenCalledWith(1);
  });

  it("given row with delete button, when clicking delete, then calls onDeleteRow", async () => {
    const user = userEvent.setup();
    const onDeleteRow = vi.fn();
    render(<VehicleList {...defaultProps} onDeleteRow={onDeleteRow} />);

    const deleteButton = screen.getAllByRole("menuitem", { name: /eliminar/i })[0]!;
    await user.click(deleteButton);

    expect(onDeleteRow).toHaveBeenCalledWith(1);
  });
});
