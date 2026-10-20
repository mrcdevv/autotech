import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ProductsDataGrid } from "./ProductsDataGrid";

import type { ProductResponse } from "@/types/catalog";

const stock = { minStock: null, reservedQuantity: 0, lowStock: false };

const mockRows: ProductResponse[] = [
  { id: 1, name: "Brake Pad", description: "Ceramic", quantity: 10, unitPrice: 25, createdAt: "", updatedAt: "", ...stock, availableQuantity: 10 },
  {
    id: 2, name: "Oil Filter", description: null, quantity: 1, unitPrice: null, createdAt: "", updatedAt: "",
    minStock: 3, reservedQuantity: 1, availableQuantity: 0, lowStock: true,
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
};

describe("ProductsDataGrid", () => {
  it("given rows, when rendered, then shows column headers and data", () => {
    render(<ProductsDataGrid {...defaultProps} />);

    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("En stock")).toBeInTheDocument();
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.getByText("Stock mín.")).toBeInTheDocument();
    expect(screen.getByText("Precio unitario")).toBeInTheDocument();
    expect(screen.getByText("Brake Pad")).toBeInTheDocument();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
  });

  it("given a product below its minimum, when rendered, then shows the low stock badge only on that row", () => {
    render(<ProductsDataGrid {...defaultProps} />);

    expect(screen.getAllByText("Stock bajo")).toHaveLength(1);
  });

  it("given loading state, when rendered, then shows loading overlay", () => {
    render(<ProductsDataGrid {...defaultProps} loading={true} rows={[]} totalCount={0} />);

    expect(screen.getByTestId("grid-loading")).toBeInTheDocument();
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

  it("given stock handlers, when clicking adjust and movements, then calls them with the row id", async () => {
    const user = userEvent.setup();
    const onAdjustStock = vi.fn();
    const onShowMovements = vi.fn();
    render(<ProductsDataGrid {...defaultProps} onAdjustStock={onAdjustStock} onShowMovements={onShowMovements} />);

    await user.click(screen.getAllByRole("menuitem", { name: /ajustar stock/i })[1]!);
    await user.click(screen.getAllByRole("menuitem", { name: /movimientos de stock/i })[0]!);

    expect(onAdjustStock).toHaveBeenCalledWith(2);
    expect(onShowMovements).toHaveBeenCalledWith(1);
  });

  it("given no stock permission, when rendered, then hides the adjust action", () => {
    render(<ProductsDataGrid {...defaultProps} onShowMovements={vi.fn()} />);

    expect(screen.queryByRole("menuitem", { name: /ajustar stock/i })).not.toBeInTheDocument();
  });
});
