import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { EstimateSummary } from "./EstimateSummary";
import { formatCurrency } from "@/utils/formatCurrency";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

describe("EstimateSummary", () => {
  const defaultProps = {
    servicesSubtotal: 500,
    productsSubtotal: 300,
    discountPercentage: 0,
    taxPercentage: 0,
    onDiscountChange: vi.fn(),
    onTaxChange: vi.fn(),
  };

  it("given subtotals, when rendered, then displays correct total", () => {
    render(<EstimateSummary {...defaultProps} />);

    expect(screen.getByText("Subtotal servicios")).toBeInTheDocument();
    expect(screen.getByText(money(500))).toBeInTheDocument();
    expect(screen.getByText(money(300))).toBeInTheDocument();
    expect(screen.getAllByText(money(800))).toHaveLength(2);
  });

  it("given discount, when rendered, then displays correct final price", () => {
    render(<EstimateSummary {...defaultProps} discountPercentage={10} />);

    // subtotal=800, discount=80, afterDiscount=720, final=720
    expect(screen.getByText(money(720))).toBeInTheDocument();
  });

  it("given tax, when rendered, then displays correct final price", () => {
    render(<EstimateSummary {...defaultProps} taxPercentage={21} />);

    // subtotal=800, tax=168, final=968
    expect(screen.getByText(money(968))).toBeInTheDocument();
  });

  it("given discount and tax, when rendered, then applies both correctly", () => {
    render(<EstimateSummary {...defaultProps} discountPercentage={10} taxPercentage={21} />);

    // subtotal=800, discount=80, afterDiscount=720, tax=151.2, final=871.2
    expect(screen.getByText(money(871.2))).toBeInTheDocument();
  });

  it("given amounts, when rendered, then every amount element is explicitly right-aligned", () => {
    render(<EstimateSummary {...defaultProps} discountPercentage={10} taxPercentage={21} />);

    const amounts = [
      money(500), // Subtotal servicios
      money(300), // Subtotal productos
      money(800), // Subtotal
      `-${money(80)}`, // Descuento
      `+${money(151.2)}`, // Impuesto (21% over 720 after the discount)
      money(871.2), // Total
    ];
    for (const amount of amounts) {
      const element = screen.getByText(amount);
      expect(getComputedStyle(element).textAlign).toBe("right");
    }
  });

  it("given readonly mode, when rendered, then disables discount and tax fields", () => {
    render(<EstimateSummary {...defaultProps} readonly />);

    const discountField = screen.getByLabelText("Descuento (%)");
    const taxField = screen.getByLabelText("Impuesto (%)");
    expect(discountField).toBeDisabled();
    expect(taxField).toBeDisabled();
  });

  it("given editable mode, when changing discount, then calls onDiscountChange", async () => {
    const onDiscountChange = vi.fn();
    const user = userEvent.setup();
    render(<EstimateSummary {...defaultProps} onDiscountChange={onDiscountChange} />);

    const discountField = screen.getByLabelText("Descuento (%)");
    await user.clear(discountField);
    await user.type(discountField, "15");

    expect(onDiscountChange).toHaveBeenCalled();
  });
});
