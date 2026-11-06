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

function buildMechanic(
  id: number,
  firstName: string,
  lastName: string,
  status: "ACTIVO" | "INACTIVO" = "ACTIVO",
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
    roles: [{ id: 3, name: "MECANICO", description: "", permissions: [], createdAt: null, updatedAt: null }],
    createdAt: "",
    updatedAt: "",
  };
}

const mechanics = [
  buildMechanic(1, "Carlos", "Lopez"),
  buildMechanic(2, "Ana", "Diaz"),
];

const mockUseMechanics = vi.fn();

vi.mock("../hooks/useMechanics", () => ({
  useMechanics: (...args: unknown[]) => mockUseMechanics(...args),
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
    mockUseMechanics.mockReturnValue({ mechanics, loading: false, error: null, refetch: vi.fn() });
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

  it("given an assigned mechanic who became inactive, when opened, then keeps them selected instead of dropping them", async () => {
    // The hook only offers active candidates, so the assigned mechanic appears
    // solely because they are already assigned to the order. The dialog must
    // still show and preserve that existing assignment.
    mockUseMechanics.mockReturnValue({
      mechanics: [buildMechanic(2, "Ana", "Diaz")],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<AssignMechanicsDialog {...defaultProps} />); // assigned: [{ id: 1, Carlos Lopez }]

    expect(screen.getByText("Carlos Lopez")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /guardar/i }));
    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith(5, [1]);
    });
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
