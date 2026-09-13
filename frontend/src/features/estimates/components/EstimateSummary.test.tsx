import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { EstimateSummary } from "./EstimateSummary";

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

    expect(screen.getByText("Total (servicios + productos): $800.00")).toBeInTheDocument();
    expect(screen.getByText("Precio final: $800.00")).toBeInTheDocument();
  });

  it("given discount, when rendered, then displays correct final price", () => {
    render(<EstimateSummary {...defaultProps} discountPercentage={10} />);

    // subtotal=800, discount=80, afterDiscount=720, final=720
    expect(screen.getByText("Precio final: $720.00")).toBeInTheDocument();
  });

  it("given tax, when rendered, then displays correct final price", () => {
    render(<EstimateSummary {...defaultProps} taxPercentage={21} />);

    // subtotal=800, tax=168, final=968
    expect(screen.getByText("Precio final: $968.00")).toBeInTheDocument();
  });

  it("given discount and tax, when rendered, then applies both correctly", () => {
    render(<EstimateSummary {...defaultProps} discountPercentage={10} taxPercentage={21} />);

    // subtotal=800, discount=80, afterDiscount=720, tax=151.2, final=871.2
    expect(screen.getByText("Precio final: $871.20")).toBeInTheDocument();
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
