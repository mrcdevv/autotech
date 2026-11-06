import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { EmployeeList } from "./EmployeeList";

import type { EmployeeResponse } from "@/features/employees/types";
import type { PageResponse } from "@/types/api";

const mockEmployee: EmployeeResponse = {
  id: 1,
  firstName: "Juana",
  lastName: "Prueba",
  dni: "12345678",
  email: "juana@example.com",
  phone: "3510001111",
  address: null,
  province: null,
  city: null,
  country: null,
  maritalStatus: null,
  childrenCount: 0,
  entryDate: null,
  status: "ACTIVO",
  roles: [],
  createdAt: "2026-01-01T00:00:00",
  updatedAt: "2026-01-01T00:00:00",
};

const mockPage: PageResponse<EmployeeResponse> = {
  content: [mockEmployee],
  totalElements: 1,
  totalPages: 1,
  size: 12,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

const defaultProps = {
  data: mockPage,
  loading: false,
  paginationModel: { page: 0, pageSize: 12 },
  onPaginationChange: vi.fn(),
  onView: vi.fn(),
  onEdit: vi.fn(),
  onResetPassword: vi.fn(),
};

describe("EmployeeList", () => {
  it("given a loaded employee row, when the user opens the row's action menu, then no delete action is offered", async () => {
    const user = userEvent.setup();
    render(<EmployeeList {...defaultProps} />);

    expect(await screen.findByText("Juana Prueba")).toBeInTheDocument();

    // The actions cell exposes its items (including the "more" trigger) with role menuitem.
    const moreTriggers = screen.getAllByRole("menuitem", { name: /more/i });
    await user.click(moreTriggers[0]!);

    expect(screen.queryByRole("menuitem", { name: "Eliminar" })).not.toBeInTheDocument();
  });

  it("given a loaded employee row, when the user opens the row's action menu, then the non-destructive actions remain", async () => {
    const user = userEvent.setup();
    render(<EmployeeList {...defaultProps} />);

    expect(await screen.findByText("Juana Prueba")).toBeInTheDocument();

    const moreTriggers = screen.getAllByRole("menuitem", { name: /more/i });
    await user.click(moreTriggers[0]!);

    expect(screen.getByRole("menuitem", { name: "Resetear contraseña" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Ver" })).toBeInTheDocument();
  });
});
