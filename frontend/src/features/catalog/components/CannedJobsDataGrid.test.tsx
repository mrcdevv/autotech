import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { CannedJobsDataGrid } from "./CannedJobsDataGrid";

import type { CannedJobResponse } from "@/types/catalog";

const mockRows: CannedJobResponse[] = [
  { id: 1, title: "Full Service", description: "Complete service", createdAt: "", updatedAt: "" },
  { id: 2, title: "Brake Overhaul", description: null, createdAt: "", updatedAt: "" },
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

describe("CannedJobsDataGrid", () => {
  it("given rows, when rendered, then shows column headers and data", () => {
    render(<CannedJobsDataGrid {...defaultProps} />);

    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(screen.getByText("Full Service")).toBeInTheDocument();
    expect(screen.getByText("Brake Overhaul")).toBeInTheDocument();
  });

  it("given row with edit button, when clicking edit, then calls onEditRow", async () => {
    const user = userEvent.setup();
    const onEditRow = vi.fn();
    render(<CannedJobsDataGrid {...defaultProps} onEditRow={onEditRow} />);

    const editButton = screen.getAllByRole("menuitem", { name: /editar/i })[0]!;
    await user.click(editButton);

    expect(onEditRow).toHaveBeenCalledWith(1);
  });

  it("given row with delete button, when clicking delete, then calls onDeleteRow", async () => {
    const user = userEvent.setup();
    const onDeleteRow = vi.fn();
    render(<CannedJobsDataGrid {...defaultProps} onDeleteRow={onDeleteRow} />);

    const deleteButton = screen.getAllByRole("menuitem", { name: /eliminar/i })[0]!;
    await user.click(deleteButton);

    expect(onDeleteRow).toHaveBeenCalledWith(1);
  });
});
