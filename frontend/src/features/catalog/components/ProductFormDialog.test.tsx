import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ProductFormDialog } from "./ProductFormDialog";

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialData: null,
};

describe("ProductFormDialog (price input alignment)", () => {
  it("given the dialog, when a unit price is typed, then the input is right-aligned but its value stays the raw editable number (decision D5)", async () => {
    const user = userEvent.setup();
    render(<ProductFormDialog {...defaultProps} />);

    const priceInput = screen.getByLabelText(/precio unitario/i);
    await user.type(priceInput, "1234.5");

    // Positive assertion: the inline style is reflected in jsdom's getComputedStyle.
    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    // D5 guard: the value must be the raw number the user is typing, never a
    // currency string like "$ 1.234,50".
    expect(priceInput).toHaveValue(1234.5);
  });

  it("given the dialog, when a whole price is typed, then the value stays raw and is right-aligned", async () => {
    const user = userEvent.setup();
    render(<ProductFormDialog {...defaultProps} />);

    const priceInput = screen.getByLabelText(/precio unitario/i);
    await user.type(priceInput, "1234");

    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    // A formatted value would render "1.234" or "$ 1.234,00"; the raw value stays "1234".
    expect(priceInput).toHaveValue(1234);
  });
});
