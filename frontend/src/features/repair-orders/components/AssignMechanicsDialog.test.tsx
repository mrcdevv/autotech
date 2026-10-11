import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { AssignMechanicsDialog } from "./AssignMechanicsDialog";

import type { EmployeeResponse } from "@/features/employees/types";

const mockAssign = vi.fn();

vi.mock("@/api/repairOrders", () => ({
  repairOrdersApi: {
    assignEmployees: (...args: unknown[]) => mockAssign(...args),
  },
}));

function buildMechanic(id: number, firstName: string, lastName: string): EmployeeResponse {
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
    status: "ACTIVO",
    roles: [{ id: 3, name: "MECANICO", description: "" }],
    createdAt: "",
    updatedAt: "",
  };
}

const mechanics = [
  buildMechanic(1, "Carlos", "Lopez"),
  buildMechanic(2, "Ana", "Diaz"),
];

vi.mock("../hooks/useMechanics", () => ({
  useMechanics: () => ({ mechanics, loading: false, error: null, refetch: vi.fn() }),
}));

const defaultProps = {
  open: true,
  orderId: 5,
  assigned: [{ id: 1, firstName: "Carlos", lastName: "Lopez" }],
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe("AssignMechanicsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssign.mockResolvedValue({ data: { data: {} } });
  });

  it("given assigned mechanics, when opened, then shows them selected", () => {
    render(<AssignMechanicsDialog {...defaultProps} />);

    expect(screen.getByText("Asignar mecánicos")).toBeInTheDocument();
    expect(screen.getByText("Carlos Lopez")).toBeInTheDocument();
  });

  it("given dialog, when clicking guardar, then assigns current mechanics and emits callbacks", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<AssignMechanicsDialog {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith(5, [1]);
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("given API error, when clicking guardar, then shows error and keeps dialog open", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockAssign.mockRejectedValueOnce(new Error("Network error"));
    render(<AssignMechanicsDialog {...defaultProps} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(await screen.findByText("Error al asignar los mecánicos")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
