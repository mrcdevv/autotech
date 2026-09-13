import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { InvoiceList } from "./InvoiceList";

import type { InvoiceResponse } from "@/types/invoice";

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows, columns, onRowClick }: {
    rows: InvoiceResponse[];
    columns: { field: string; headerName: string }[];
    onRowClick?: (params: { row: InvoiceResponse }) => void;
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
            <tr key={row.id} onClick={() => onRowClick?.({ row })}>
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

const sampleInvoices: InvoiceResponse[] = [
  {
    id: 1,
    clientId: 1,
    clientFullName: "Juan Perez",
    vehicleId: 1,
    vehiclePlate: "ABC123",
    vehicleModel: "Corolla",
    repairOrderId: null,
    estimateId: null,
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
    estimateId: null,
    status: "PAGADA",
    discountPercentage: 10,
    taxPercentage: 21,
    total: 1000,
    createdAt: "2025-01-16T10:00:00",
    updatedAt: "2025-01-16T10:00:00",
  },
];

describe("InvoiceList", () => {
  const defaultProps = {
    rows: sampleInvoices,
    loading: false,
    totalCount: 2,
    page: 0,
    pageSize: 12,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onRowClick: vi.fn(),
    onDelete: vi.fn(),
  };

  it("given invoices, when rendered, then shows DataGrid", () => {
    render(<InvoiceList {...defaultProps} />);
    expect(screen.getByTestId("mock-datagrid")).toBeInTheDocument();
  });

  it("given invoices, when rendered, then shows client names", () => {
    render(<InvoiceList {...defaultProps} />);
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("Maria Lopez")).toBeInTheDocument();
  });

  it("given invoices, when clicking row, then calls onRowClick with row", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(<InvoiceList {...defaultProps} onRowClick={onRowClick} />);

    await user.click(screen.getByText("Juan Perez"));

    expect(onRowClick).toHaveBeenCalledWith(sampleInvoices[0]);
  });
});
