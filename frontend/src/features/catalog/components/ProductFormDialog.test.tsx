import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ProductFormDialog } from "./ProductFormDialog";
import { formatCurrency } from "@/utils/formatCurrency";

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialData: null,
};

describe("ProductFormDialog (money input two states)", () => {
  it("given the dialog, when a unit price is typed, then the focused field shows the plain number being typed (decision D14, supersedes the D5 raw-value rule)", async () => {
    const user = userEvent.setup();
    render(<ProductFormDialog {...defaultProps} />);

    const priceInput = screen.getByLabelText(/precio unitario/i);
    await user.type(priceInput, "1234.5");

    // Positive assertion: the inline style is reflected in jsdom's getComputedStyle.
    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    // D14: while focused the field shows the plain number being typed — no symbol,
    // no thousands separator, because a formatted string breaks typing.
    expect(priceInput).toHaveValue("1234.5");
  });

  it("given the dialog, when the field loses focus, then it shows the shared 2-decimal currency value, right-aligned (decision D14)", async () => {
    const user = userEvent.setup();
    render(<ProductFormDialog {...defaultProps} />);

    const priceInput = screen.getByLabelText(/precio unitario/i);
    await user.type(priceInput, "1234");
    await user.tab();

    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    // Not focused: exactly the shared formatter output (2 decimals, single "$"),
    // never a raw "1234".
    expect(priceInput).toHaveValue(formatCurrency(1234));
  });
});
