import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ProductsDataGrid } from "./ProductsDataGrid";

import type { ProductResponse } from "@/types/catalog";

const mockRows: ProductResponse[] = [
  { id: 1, name: "Brake Pad", description: "Ceramic", quantity: 10, unitPrice: 25, createdAt: "", updatedAt: "" },
  { id: 2, name: "Oil Filter", description: null, quantity: 0, unitPrice: null, createdAt: "", updatedAt: "" },
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
};

describe("ProductsDataGrid", () => {
  it("given rows, when rendered, then shows column headers and data", () => {
    render(<ProductsDataGrid {...defaultProps} />);

    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Cantidad")).toBeInTheDocument();
    expect(screen.getByText("Precio unitario")).toBeInTheDocument();
    expect(screen.getByText("Brake Pad")).toBeInTheDocument();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
  });

  it("given loading state, when rendered, then shows loading overlay", () => {
    render(<ProductsDataGrid {...defaultProps} loading={true} rows={[]} totalCount={0} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("given row with edit button, when clicking edit, then calls onEditRow", async () => {
    const user = userEvent.setup();
    const onEditRow = vi.fn();
    render(<ProductsDataGrid {...defaultProps} onEditRow={onEditRow} />);

    const editButton = screen.getAllByRole("menuitem", { name: /editar/i })[0]!;
    await user.click(editButton);

    expect(onEditRow).toHaveBeenCalledWith(1);
  });

  it("given row with delete button, when clicking delete, then calls onDeleteRow", async () => {
    const user = userEvent.setup();
    const onDeleteRow = vi.fn();
    render(<ProductsDataGrid {...defaultProps} onDeleteRow={onDeleteRow} />);

    const deleteButton = screen.getAllByRole("menuitem", { name: /eliminar/i })[0]!;
    await user.click(deleteButton);

    expect(onDeleteRow).toHaveBeenCalledWith(1);
  });
});
