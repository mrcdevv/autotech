import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { CashPaymentDialog } from "./CashPaymentDialog";
import { CURRENCY_SYMBOL } from "@/components/MoneyInput";
import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
} from "@/utils/formatCurrency";

import type { PaymentResponse } from "@/types/payment";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

const mockCreatePayment = vi.fn();
const mockUpdatePayment = vi.fn();

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

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  deliveryNoteId: 10,
  remaining: 500,
  clientFullName: "Juan Perez",
  editingPayment: null as PaymentResponse | null,
  onCreated: vi.fn(),
  onUpdated: vi.fn(),
};

const buildEditingPayment = (
  overrides?: Partial<PaymentResponse>,
): PaymentResponse => ({
  id: 1,
  deliveryNoteId: 10,
  paymentDate: "2025-03-10",
  createdAt: "2025-03-10T10:00:00",
  amount: 200,
  payerName: "Carlos Lopez",
  paymentType: "EFECTIVO",
  bankAccountId: null,
  bankAccountAlias: null,
  bankName: null,
  registeredByEmployeeId: 1,
  registeredByEmployeeFullName: "Admin",
  ...overrides,
});

describe("CashPaymentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given open dialog, when rendered, then shows create title", () => {
    render(<CashPaymentDialog {...defaultProps} />);

    expect(
      screen.getByText("Agregar pago en efectivo"),
    ).toBeInTheDocument();
  });

  it("given open dialog, when rendered, then defaults date to today", () => {
    render(<CashPaymentDialog {...defaultProps} />);

    const dateInput = screen.getByLabelText("Fecha de pago");
    const today = new Date().toISOString().slice(0, 10);
    expect(dateInput).toHaveValue(today);
  });

  it("given open dialog, when rendered, then shows remaining value", () => {
    render(<CashPaymentDialog {...defaultProps} />);

    expect(screen.getByDisplayValue(money(500))).toBeInTheDocument();
  });

  it("given open dialog, when rendered, then shows the remaining balance in the shared 2-decimal format, right-aligned", () => {
    render(<CashPaymentDialog {...defaultProps} remaining={1234.5} />);

    const remainingInput = screen.getByDisplayValue(money(1234.5));
    // Exact raw-value match (no normalization): proves exactly 2 decimals and a single
    // "$" symbol, with the U+00A0 the helper emits.
    expect(remainingInput).toHaveValue(formatCurrency(1234.5));
    // Positive assertion: the inline style is reflected in jsdom's getComputedStyle.
    expect(getComputedStyle(remainingInput).textAlign).toBe("right");
  });

  it("given open dialog, when rendered, then the amount shows the symbol-less shared amount when not focused and the plain number when focused, with the adornment carrying the symbol in BOTH states (decision D16)", async () => {
    const user = userEvent.setup();
    render(<CashPaymentDialog {...defaultProps} />);

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

  it("given remaining field, when clicked, then fills amount with remaining", async () => {
    const user = userEvent.setup();
    render(<CashPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue(money(500)));

    const amountInput = screen.getByLabelText("Monto a pagar");
    // Not focused: the symbol-less shared amount — the adornment carries the symbol.
    expect(amountInput).toHaveValue(formatCurrencyWithoutSymbol(500));
  });

  it("given payer name field, when rendered, then shows client name as placeholder", () => {
    render(<CashPaymentDialog {...defaultProps} />);

    const payerInput = screen.getByLabelText(
      "Nombre de la persona que realizó el pago",
    );
    expect(payerInput).toHaveAttribute("placeholder", "Juan Perez");
  });

  it("given amount is 0, when rendered, then Aceptar button is disabled", () => {
    render(<CashPaymentDialog {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
  });

  it("given valid amount, when clicking Aceptar, then shows confirmation alert", async () => {
    const user = userEvent.setup();
    render(<CashPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue(money(500)));
    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(
      screen.getByText(/¿Está seguro que desea registrar este pago\?/),
    ).toBeInTheDocument();
  });

  it("given confirmation shown, when clicking Confirmar, then calls createPayment", async () => {
    const user = userEvent.setup();
    mockCreatePayment.mockResolvedValue(undefined);
    render(<CashPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue(money(500)));
    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500,
          paymentType: "EFECTIVO",
          bankAccountId: null,
        }),
      );
    });
  });

  it("given confirmation shown, when clicking Cancelar in alert, then hides alert", async () => {
    const user = userEvent.setup();
    render(<CashPaymentDialog {...defaultProps} />);

    await user.click(screen.getByDisplayValue(money(500)));
    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(
      screen.getByText(/¿Está seguro que desea registrar este pago\?/),
    ).toBeInTheDocument();

    const cancelButtons = screen.getAllByRole("button", { name: "Cancelar" });
    const alertCancelBtn = cancelButtons.find(
      (btn) => btn.closest(".MuiAlert-root") !== null,
    )!;
    await user.click(alertCancelBtn);

    expect(
      screen.queryByText(/¿Está seguro que desea registrar este pago\?/),
    ).not.toBeInTheDocument();
  });

  it("given edit mode, when rendered, then shows edit title and pre-fills values", () => {
    const editing = buildEditingPayment();
    render(
      <CashPaymentDialog {...defaultProps} editingPayment={editing} />,
    );

    expect(
      screen.getByText("Modificar pago en efectivo"),
    ).toBeInTheDocument();

    const dateInput = screen.getByLabelText("Fecha de pago");
    expect(dateInput).toHaveValue("2025-03-10");

    const amountInput = screen.getByLabelText("Monto a pagar");
    // Not focused: the symbol-less 2-decimal es-AR amount.
    expect(amountInput).toHaveValue(formatCurrencyWithoutSymbol(200));
  });

  it("given edit mode, when confirming, then calls updatePayment", async () => {
    const user = userEvent.setup();
    mockUpdatePayment.mockResolvedValue(undefined);
    const editing = buildEditingPayment();
    render(
      <CashPaymentDialog {...defaultProps} editingPayment={editing} />,
    );

    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(mockUpdatePayment).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ paymentType: "EFECTIVO" }),
      );
    });
  });

  it("given dialog open, when clicking Cancelar in actions, then calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CashPaymentDialog {...defaultProps} onClose={onClose} />);

    const cancelButtons = screen.getAllByRole("button", { name: "Cancelar" });
    const dialogCancelBtn = cancelButtons.find(
      (btn) => btn.closest(".MuiDialogActions-root") !== null,
    )!;
    await user.click(dialogCancelBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
