import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { BankPaymentDialog } from "./BankPaymentDialog";

import type {
  PaymentResponse,
  BankAccountResponse,
} from "@/types/payment";

const mockCreatePayment = vi.fn();
const mockUpdatePayment = vi.fn();

const mockBankAccounts: BankAccountResponse[] = [
  {
    id: 1,
    bankId: 10,
    bankName: "Banco Nacion",
    alias: "Cuenta principal",
    cbuCvu: "1234567890",
    createdAt: "2025-01-01T00:00:00",
  },
  {
    id: 2,
    bankId: 20,
    bankName: "Mercadopago",
    alias: "MP",
    cbuCvu: null,
    createdAt: "2025-01-01T00:00:00",
  },
];

vi.mock("../hooks/usePayments", () => ({
  usePayments: () => ({
    payments: [],
    loading: false,
    error: null,
    createPayment: mockCreatePayment,
    updatePayment: mockUpdatePayment,
    deletePayment: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock("../hooks/useBankAccounts", () => ({
  useBankAccounts: () => ({
    bankAccounts: mockBankAccounts,
    banks: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  invoiceId: 10,
  remaining: 800,
  clientFullName: "Maria Garcia",
  editingPayment: null as PaymentResponse | null,
  onCreated: vi.fn(),
  onUpdated: vi.fn(),
};

const buildEditingPayment = (
  overrides?: Partial<PaymentResponse>,
): PaymentResponse => ({
  id: 5,
  invoiceId: 10,
  paymentDate: "2025-04-15",
  createdAt: "2025-04-15T14:00:00",
  amount: 300,
  payerName: "Pedro Sanchez",
  paymentType: "CUENTA_BANCARIA",
  bankAccountId: 1,
  bankAccountAlias: "Cuenta principal",
  bankName: "Banco Nacion",
  registeredByEmployeeId: 2,
  registeredByEmployeeFullName: "Admin",
  ...overrides,
});

describe("BankPaymentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given open dialog, when rendered, then shows create title", () => {
    render(<BankPaymentDialog {...defaultProps} />);

    expect(
      screen.getByText("Agregar pago a cuenta bancaria"),
    ).toBeInTheDocument();
  });

  it("given open dialog, when rendered, then defaults date to today", () => {
    render(<BankPaymentDialog {...defaultProps} />);

    const dateInput = screen.getByLabelText("Fecha de pago");
    const today = new Date().toISOString().slice(0, 10);
    expect(dateInput).toHaveValue(today);
  });

  it("given open dialog, when rendered, then shows remaining value", () => {
    render(<BankPaymentDialog {...defaultProps} />);

    expect(screen.getByDisplayValue("$800.00")).toBeInTheDocument();
  });

  it("given remaining field, when clicked, then fills amount", async () => {
    const user = userEvent.setup();
    render(<BankPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue("$800.00"));

    const amountInput = screen.getByLabelText("Monto a pagar");
    expect(amountInput).toHaveValue(800);
  });

  it("given bank account autocomplete, when rendered, then shows options", async () => {
    const user = userEvent.setup();
    render(<BankPaymentDialog {...defaultProps} />);

    const autocompleteInput = screen.getByLabelText("Cuenta bancaria *");
    await user.click(autocompleteInput);

    expect(
      await screen.findByText("Banco Nacion - Cuenta principal"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mercadopago - MP")).toBeInTheDocument();
  });

  it("given no bank account selected and amount > 0, when rendered, then Aceptar is disabled", async () => {
    const user = userEvent.setup();
    render(<BankPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue("$800.00"));

    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
  });

  it("given bank account selected and valid amount, when clicking Aceptar, then shows confirmation", async () => {
    const user = userEvent.setup();
    render(<BankPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue("$800.00"));

    const autocompleteInput = screen.getByLabelText("Cuenta bancaria *");
    await user.click(autocompleteInput);
    await user.click(
      await screen.findByText("Banco Nacion - Cuenta principal"),
    );

    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(
      screen.getByText(/¿Está seguro que desea registrar este pago\?/),
    ).toBeInTheDocument();
  });

  it("given confirmation shown, when clicking Confirmar, then calls createPayment with bank account", async () => {
    const user = userEvent.setup();
    mockCreatePayment.mockResolvedValue(undefined);
    render(<BankPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue("$800.00"));

    const autocompleteInput = screen.getByLabelText("Cuenta bancaria *");
    await user.click(autocompleteInput);
    await user.click(
      await screen.findByText("Banco Nacion - Cuenta principal"),
    );

    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 800,
          paymentType: "CUENTA_BANCARIA",
          bankAccountId: 1,
        }),
      );
    });
  });

  it("given edit mode, when rendered, then shows edit title and pre-fills values", () => {
    const editing = buildEditingPayment();
    render(
      <BankPaymentDialog {...defaultProps} editingPayment={editing} />,
    );

    expect(
      screen.getByText("Modificar pago a cuenta bancaria"),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Fecha de pago")).toHaveValue("2025-04-15");
    expect(screen.getByLabelText("Monto a pagar")).toHaveValue(300);
  });

  it("given edit mode, when rendered, then pre-selects bank account", () => {
    const editing = buildEditingPayment();
    render(
      <BankPaymentDialog {...defaultProps} editingPayment={editing} />,
    );

    expect(
      screen.getByDisplayValue("Banco Nacion - Cuenta principal"),
    ).toBeInTheDocument();
  });

  it("given edit mode, when confirming, then calls updatePayment", async () => {
    const user = userEvent.setup();
    mockUpdatePayment.mockResolvedValue(undefined);
    const editing = buildEditingPayment();
    render(
      <BankPaymentDialog {...defaultProps} editingPayment={editing} />,
    );

    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(mockUpdatePayment).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          paymentType: "CUENTA_BANCARIA",
          bankAccountId: 1,
        }),
      );
    });
  });

  it("given payer name field, when rendered, then shows client name as placeholder", () => {
    render(<BankPaymentDialog {...defaultProps} />);

    const payerInput = screen.getByLabelText(
      "Nombre de la persona que realizó el pago",
    );
    expect(payerInput).toHaveAttribute("placeholder", "Maria Garcia");
  });
});
