import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { EstimateList } from "./EstimateList";

import type { EstimateResponse } from "@/types/estimate";

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows, columns, onRowClick }: {
    rows: EstimateResponse[];
    columns: { field: string; headerName: string }[];
    onRowClick?: (params: { row: { id: number } }) => void;
  }) => (
    <div data-testid="mock-datagrid">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.field}>{col.headerName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.({ row: { id: row.id } })}>
              <td>{row.clientFullName}</td>
              <td>{row.vehiclePlate}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}));

const sampleEstimates: EstimateResponse[] = [
  {
    id: 1,
    clientId: 1,
    clientFullName: "Juan Perez",
    vehicleId: 1,
    vehiclePlate: "ABC123",
    vehicleModel: "Corolla",
    repairOrderId: null,
    status: "PENDIENTE",
    discountPercentage: 0,
    taxPercentage: 0,
    total: 500,
    createdAt: "2025-01-15T10:00:00",
    updatedAt: "2025-01-15T10:00:00",
  },
  {
    id: 2,
    clientId: 2,
    clientFullName: "Maria Lopez",
    vehicleId: 2,
    vehiclePlate: "XYZ789",
    vehicleModel: "Focus",
    repairOrderId: 5,
    status: "ACEPTADO",
    discountPercentage: 10,
    taxPercentage: 21,
    total: 1000,
    createdAt: "2025-01-16T10:00:00",
    updatedAt: "2025-01-16T10:00:00",
  },
];

describe("EstimateList", () => {
  const defaultProps = {
    rows: sampleEstimates,
    loading: false,
    totalCount: 2,
    page: 0,
    pageSize: 12,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onRowClick: vi.fn(),
    onDelete: vi.fn(),
    onInvoice: vi.fn(),
  };

  it("given estimates, when rendered, then shows DataGrid", () => {
    render(<EstimateList {...defaultProps} />);
    expect(screen.getByTestId("mock-datagrid")).toBeInTheDocument();
  });

  it("given estimates, when rendered, then shows client names", () => {
    render(<EstimateList {...defaultProps} />);
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("Maria Lopez")).toBeInTheDocument();
  });

  it("given estimates, when clicking row, then calls onRowClick with id", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(<EstimateList {...defaultProps} onRowClick={onRowClick} />);

    await user.click(screen.getByText("Juan Perez"));

    expect(onRowClick).toHaveBeenCalledWith(1);
  });
});
