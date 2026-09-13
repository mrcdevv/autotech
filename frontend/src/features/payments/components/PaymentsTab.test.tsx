import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { PaymentsTab } from "./PaymentsTab";

import type { PaymentResponse, PaymentSummaryResponse } from "@/types/payment";

const mockSummary: PaymentSummaryResponse = {
  totalServices: 1000,
  totalProducts: 200,
  taxAmount: 226.8,
  discountAmount: 120,
  total: 1306.8,
  totalPaid: 500,
  remaining: 806.8,
};

const mockPayments: PaymentResponse[] = [
  {
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
    registeredByEmployeeFullName: "Admin",
  },
];

const mockRefetch = vi.fn();
const mockRefetchSummary = vi.fn();
const mockDeletePayment = vi.fn();

vi.mock("../hooks/usePayments", () => ({
  usePayments: () => ({
    payments: mockPayments,
    loading: false,
    error: null,
    createPayment: vi.fn(),
    updatePayment: vi.fn(),
    deletePayment: mockDeletePayment,
    refetch: mockRefetch,
  }),
}));

vi.mock("../hooks/usePaymentSummary", () => ({
  usePaymentSummary: () => ({
    summary: mockSummary,
    loading: false,
    error: null,
    refetch: mockRefetchSummary,
  }),
}));

vi.mock("./CashPaymentDialog", () => ({
  CashPaymentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="cash-dialog">Cash Dialog</div> : null,
}));

vi.mock("./BankPaymentDialog", () => ({
  BankPaymentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="bank-dialog">Bank Dialog</div> : null,
}));

describe("PaymentsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given invoice with payments, when rendered, then shows summary and history", () => {
    render(<PaymentsTab invoiceId={10} clientFullName="Juan Perez" />);

    expect(screen.getByText("Resumen de pagos")).toBeInTheDocument();
    expect(screen.getByText("Historial de pagos")).toBeInTheDocument();
  });

  it("given remaining > 0, when rendered, then buttons are enabled", () => {
    render(<PaymentsTab invoiceId={10} clientFullName="Juan Perez" />);

    const cashBtn = screen.getByRole("button", { name: /efectivo/i });
    const bankBtn = screen.getByRole("button", { name: /cuenta bancaria/i });
    expect(cashBtn).not.toBeDisabled();
    expect(bankBtn).not.toBeDisabled();
  });

  it("given cash button clicked, when rendered, then opens cash dialog", async () => {
    const user = userEvent.setup();
    render(<PaymentsTab invoiceId={10} clientFullName="Juan Perez" />);

    await user.click(screen.getByRole("button", { name: /efectivo/i }));

    expect(screen.getByTestId("cash-dialog")).toBeInTheDocument();
  });

  it("given bank button clicked, when rendered, then opens bank dialog", async () => {
    const user = userEvent.setup();
    render(<PaymentsTab invoiceId={10} clientFullName="Juan Perez" />);

    await user.click(screen.getByRole("button", { name: /cuenta bancaria/i }));

    expect(screen.getByTestId("bank-dialog")).toBeInTheDocument();
  });
});
