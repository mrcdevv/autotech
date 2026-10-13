import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, it, expect } from "vitest";

import EmployeesPage from "./EmployeesPage";

import type { EmployeeResponse } from "@/features/employees/types";
import type { PageResponse } from "@/types/api";

vi.mock("@/api/employees", () => ({
  employeesApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    searchByDni: vi.fn(),
    filterByStatus: vi.fn(),
    filterByRole: vi.fn(),
    assignRoles: vi.fn(),
    resetPassword: vi.fn(),
    exportToExcel: vi.fn(),
  },
}));

vi.mock("@/api/roles", () => ({
  rolesApi: {
    getAll: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

import { employeesApi } from "@/api/employees";

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
  roles: [{ id: 2, name: "Mecanico", description: "Mecanico" }],
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

describe("EmployeesPage", () => {
  beforeEach(() => {
    vi.mocked(employeesApi.getAll).mockResolvedValue({ data: { data: mockPage } } as never);
    vi.mocked(employeesApi.update).mockResolvedValue({} as never);
  });

  it("given the employees page is loaded, when the user opens a row's action menu, then it offers no delete action", async () => {
    const user = userEvent.setup();
    render(<EmployeesPage />);

    expect(await screen.findByText("Juana Prueba")).toBeInTheDocument();

    // The actions cell exposes its items (including the "more" trigger) with role menuitem.
    const moreTriggers = screen.getAllByRole("menuitem", { name: /more/i });
    await user.click(moreTriggers[0]!);

    expect(screen.queryByRole("menuitem", { name: "Eliminar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Confirmar Eliminación")).not.toBeInTheDocument();
  });

  it("given a loaded employee, when the user edits it and sets Estado to Inactivo, then the page saves the change with status INACTIVO", async () => {
    const user = userEvent.setup();
    render(<EmployeesPage />);

    expect(await screen.findByText("Juana Prueba")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Editar" }));

    expect(await screen.findByText("Editar Empleado")).toBeInTheDocument();

    // The Estado select has no accessible name in this form; it is the only combobox
    // showing the employee's current status.
    const estadoSelect = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent === "Activo");
    expect(estadoSelect).toBeDefined();
    await user.click(estadoSelect!);
    await user.click(screen.getByRole("option", { name: "Inactivo" }));

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(employeesApi.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: "INACTIVO" })
    );
  });
});
