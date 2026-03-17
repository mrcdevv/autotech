import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { PaymentHistoryGrid } from "./PaymentHistoryGrid";

import type { PaymentResponse } from "@/types/payment";

const buildPayment = (overrides?: Partial<PaymentResponse>): PaymentResponse => ({
  id: 1,
  invoiceId: 10,
  paymentDate: "2025-01-15",
  createdAt: "2025-01-15T10:30:00",
  amount: 500,
  payerName: "Juan Perez",
  paymentType: "EFECTIVO",
  bankAccountId: null,
  bankAccountAlias: null,
  bankName: null,
  registeredByEmployeeId: 1,
  registeredByEmployeeFullName: "Admin User",
  ...overrides,
});

describe("PaymentHistoryGrid", () => {
  it("given no payments, when rendered, then shows empty state message", () => {
    render(
      <PaymentHistoryGrid
        payments={[]}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No se registraron pagos para esta factura."),
    ).toBeInTheDocument();
  });

  it("given payments exist, when rendered, then shows grid with data", () => {
    render(
      <PaymentHistoryGrid
        payments={[buildPayment()]}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Historial de pagos")).toBeInTheDocument();
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
  });

  it("given bank payment, when rendered, then shows correct chip", () => {
    render(
      <PaymentHistoryGrid
        payments={[buildPayment({ paymentType: "CUENTA_BANCARIA" })]}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Cuenta bancaria")).toBeInTheDocument();
  });

  it("given payment, when clicking edit button, then calls onEdit", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const payment = buildPayment();

    render(
      <PaymentHistoryGrid
        payments={[payment]}
        loading={false}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    const editButtons = screen.getAllByTestId("EditIcon");
    await user.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(payment);
  });

  it("given payment, when clicking delete button, then calls onDelete", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <PaymentHistoryGrid
        payments={[buildPayment()]}
        loading={false}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    const deleteButtons = screen.getAllByTestId("DeleteIcon");
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(1, 1);
  });
});
