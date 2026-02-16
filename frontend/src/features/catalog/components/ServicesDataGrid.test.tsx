import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ServicesDataGrid } from "./ServicesDataGrid";

import type { CatalogServiceResponse } from "@/types/catalog";

const mockRows: CatalogServiceResponse[] = [
  { id: 1, name: "Oil Change", description: "Full oil change", price: 50, createdAt: "", updatedAt: "" },
  { id: 2, name: "Tire Rotation", description: null, price: null, createdAt: "", updatedAt: "" },
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

describe("ServicesDataGrid", () => {
  it("given rows, when rendered, then shows column headers and data", () => {
    render(<ServicesDataGrid {...defaultProps} />);

    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(screen.getByText("Precio")).toBeInTheDocument();
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Tire Rotation")).toBeInTheDocument();
  });

  it("given loading state, when rendered, then shows loading overlay", () => {
    render(<ServicesDataGrid {...defaultProps} loading={true} rows={[]} totalCount={0} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("given row with edit button, when clicking edit, then calls onEditRow", async () => {
    const user = userEvent.setup();
    const onEditRow = vi.fn();
    render(<ServicesDataGrid {...defaultProps} onEditRow={onEditRow} />);

    const editButton = screen.getAllByRole("menuitem", { name: /editar/i })[0]!;
    await user.click(editButton);

    expect(onEditRow).toHaveBeenCalledWith(1);
  });

  it("given row with delete button, when clicking delete, then calls onDeleteRow", async () => {
    const user = userEvent.setup();
    const onDeleteRow = vi.fn();
    render(<ServicesDataGrid {...defaultProps} onDeleteRow={onDeleteRow} />);

    const deleteButton = screen.getAllByRole("menuitem", { name: /eliminar/i })[0]!;
    await user.click(deleteButton);

    expect(onDeleteRow).toHaveBeenCalledWith(1);
  });
});
