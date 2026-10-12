import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ServiceFormDialog } from "./ServiceFormDialog";
import { CURRENCY_SYMBOL } from "@/components/MoneyInput";
import { formatCurrencyWithoutSymbol } from "@/utils/formatCurrency";

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialData: null,
};

describe("ServiceFormDialog (money input two states)", () => {
  it("given the dialog, when a price is typed, then the focused field shows the plain number while the adornment carries the symbol (decision D16)", async () => {
    const user = userEvent.setup();
    render(<ServiceFormDialog {...defaultProps} />);

    const priceInput = screen.getByLabelText(/precio/i);
    await user.type(priceInput, "1234.5");

    // Positive assertion: the inline style is reflected in jsdom's getComputedStyle.
    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    // D16: focused the input text is the plain number being typed — the symbol
    // lives in the startAdornment, never in the text.
    expect(priceInput).toHaveValue("1234.5");
    expect(
      priceInput
        .closest(".MuiInputBase-root")
        ?.querySelector(".MuiInputAdornment-root"),
    ).toHaveTextContent(CURRENCY_SYMBOL);
  });

  it("given the dialog, when the field loses focus, then it shows the symbol-less shared 2-decimal amount while the adornment carries the symbol, right-aligned (decision D16)", async () => {
    const user = userEvent.setup();
    render(<ServiceFormDialog {...defaultProps} />);

    const priceInput = screen.getByLabelText(/precio/i);
    await user.type(priceInput, "1234");
    await user.tab();

    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    // Not focused: the symbol-less shared amount (2 decimals, thousands
    // grouping); the adornment carries the symbol instead of the text.
    expect(priceInput).toHaveValue(formatCurrencyWithoutSymbol(1234));
    expect(
      priceInput
        .closest(".MuiInputBase-root")
        ?.querySelector(".MuiInputAdornment-root"),
    ).toHaveTextContent(CURRENCY_SYMBOL);
  });
});
