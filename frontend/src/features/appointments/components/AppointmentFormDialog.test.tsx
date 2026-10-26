import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { AppointmentFormDialog } from "./AppointmentFormDialog";

import type { EmployeeResponse } from "@/features/employees/types";

const mockGetAllEmployees = vi.fn();
const mockFilterByStatus = vi.fn();

vi.mock("@/api/employees", () => ({
  employeesApi: {
    getAll: (...args: unknown[]) => mockGetAllEmployees(...args),
    filterByStatus: (...args: unknown[]) => mockFilterByStatus(...args),
  },
}));

vi.mock("@/api/clients", () => ({
  clientsApi: {
    getAll: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
  },
}));

vi.mock("@/api/tags", () => ({
  tagsApi: {
    getAll: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

function buildEmployee(
  id: number,
  status: "ACTIVO" | "INACTIVO",
  firstName: string,
  lastName: string,
): EmployeeResponse {
  return {
    id,
    firstName,
    lastName,
    dni: `dni-${id}`,
    email: null,
    phone: "1234567890",
    address: null,
    province: null,
    city: null,
    country: null,
    maritalStatus: null,
    childrenCount: 0,
    entryDate: null,
    status,
    roles: [],
    createdAt: "",
    updatedAt: "",
  };
}

function renderDialog() {
  return render(
    <MemoryRouter>
      <AppointmentFormDialog
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        defaultDurationMinutes={60}
      />
    </MemoryRouter>,
  );
}

describe("AppointmentFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Raw, unfiltered data: what the server returns for getAll.
    mockGetAllEmployees.mockResolvedValue({
      data: {
        data: {
          content: [
            buildEmployee(1, "ACTIVO", "Ana", "Activa"),
            buildEmployee(2, "INACTIVO", "Bruno", "Inactivo"),
          ],
        },
      },
    });
    // What the server returns when asked for active employees only.
    mockFilterByStatus.mockResolvedValue({
      data: {
        data: {
          content: [buildEmployee(1, "ACTIVO", "Ana", "Activa")],
        },
      },
    });
  });

  it("given an inactive employee, when opening the employee picker, then only active employees are offered", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = await screen.findByLabelText("Empleados");
    await user.click(input);

    const listbox = await screen.findByRole("listbox");
    expect(await within(listbox).findByText("Ana Activa")).toBeInTheDocument();
    expect(within(listbox).queryByText("Bruno Inactivo")).not.toBeInTheDocument();

    // The active-only candidates must come from the server-side status filter,
    // not from client-side filtering of an unfiltered page.
    expect(mockFilterByStatus).toHaveBeenCalledWith("ACTIVO", 0, 100);
    expect(mockGetAllEmployees).not.toHaveBeenCalled();
  });
});
