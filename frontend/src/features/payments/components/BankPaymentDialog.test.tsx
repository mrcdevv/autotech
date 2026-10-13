import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { BankPaymentDialog } from "./BankPaymentDialog";
import { CURRENCY_SYMBOL } from "@/components/MoneyInput";
import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
} from "@/utils/formatCurrency";

import type {
  PaymentResponse,
  BankAccountResponse,
} from "@/types/payment";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

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

    expect(screen.getByDisplayValue(money(800))).toBeInTheDocument();
  });

  it("given open dialog, when rendered, then shows the remaining balance in the shared 2-decimal format, right-aligned", () => {
    render(<BankPaymentDialog {...defaultProps} remaining={1234.5} />);

    const remainingInput = screen.getByDisplayValue(money(1234.5));
    // Exact raw-value match (no normalization): proves exactly 2 decimals and a single
    // "$" symbol, with the U+00A0 the helper emits.
    expect(remainingInput).toHaveValue(formatCurrency(1234.5));
    // Positive assertion: the inline style is reflected in jsdom's getComputedStyle.
    expect(getComputedStyle(remainingInput).textAlign).toBe("right");
  });

  it("given open dialog, when rendered, then the amount shows the symbol-less shared amount when not focused and the plain number when focused, with the adornment carrying the symbol in BOTH states (decision D16)", async () => {
    const user = userEvent.setup();
    render(<BankPaymentDialog {...defaultProps} />);

    const amountInput = screen.getByLabelText<HTMLInputElement>("Monto a pagar");
    // Not focused: the symbol-less 2-decimal es-AR amount; the adornment
    // carries the symbol instead of the input text.
    expect(getComputedStyle(amountInput).textAlign).toBe("right");
    expect(amountInput).toHaveValue(formatCurrencyWithoutSymbol(0));
    expect(amountInput.value).not.toContain(CURRENCY_SYMBOL);
    expect(
      amountInput
        .closest(".MuiInputBase-root")
        ?.querySelector(".MuiInputAdornment-root"),
    ).toHaveTextContent(CURRENCY_SYMBOL);

    await user.click(amountInput);
    // D16: focused the input text is just the plain number being typed; the
    // symbol stays in the adornment, never in the text.
    expect(amountInput).toHaveValue("0");
    expect(amountInput.value).not.toContain(CURRENCY_SYMBOL);
  });

  it("given remaining field, when clicked, then fills amount", async () => {
    const user = userEvent.setup();
    render(<BankPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue(money(800)));

    const amountInput = screen.getByLabelText("Monto a pagar");
    // Not focused: the symbol-less shared amount — the adornment carries the symbol.
    expect(amountInput).toHaveValue(formatCurrencyWithoutSymbol(800));
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

    await user.click(screen.getByDisplayValue(money(800)));

    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
  });

  it("given bank account selected and valid amount, when clicking Aceptar, then shows confirmation", async () => {
    const user = userEvent.setup();
    render(<BankPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue(money(800)));

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

    await user.click(screen.getByDisplayValue(money(800)));

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
    // Not focused: the symbol-less 2-decimal es-AR amount.
    expect(screen.getByLabelText("Monto a pagar")).toHaveValue(formatCurrencyWithoutSymbol(300));
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
