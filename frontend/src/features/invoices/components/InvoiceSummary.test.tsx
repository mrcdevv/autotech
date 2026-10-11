import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { InvoiceSummary } from "./InvoiceSummary";

const money = (value: number) =>
  value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

describe("InvoiceSummary", () => {
  const defaultProps = {
    servicesSubtotal: 500,
    productsSubtotal: 300,
    discountPercentage: 0,
    taxPercentage: 0,
    onDiscountChange: vi.fn(),
    onTaxChange: vi.fn(),
  };

  it("given subtotals, when rendered, then displays correct total", () => {
    render(<InvoiceSummary {...defaultProps} />);

    expect(screen.getByText("Subtotal servicios")).toBeInTheDocument();
    expect(screen.getByText(`$ ${money(500)}`)).toBeInTheDocument();
    expect(screen.getByText(`$ ${money(300)}`)).toBeInTheDocument();
    expect(screen.getAllByText(`$ ${money(800)}`)).toHaveLength(2);
  });

  it("given discount, when rendered, then displays correct final price", () => {
    render(<InvoiceSummary {...defaultProps} discountPercentage={10} />);

    expect(screen.getByText(`$ ${money(720)}`)).toBeInTheDocument();
  });

  it("given tax, when rendered, then displays correct final price", () => {
    render(<InvoiceSummary {...defaultProps} taxPercentage={21} />);

    expect(screen.getByText(`$ ${money(968)}`)).toBeInTheDocument();
  });

  it("given discount and tax, when rendered, then applies both correctly", () => {
    render(<InvoiceSummary {...defaultProps} discountPercentage={10} taxPercentage={21} />);

    expect(screen.getByText(`$ ${money(871.2)}`)).toBeInTheDocument();
  });

  it("given readonly mode, when rendered, then disables discount and tax fields", () => {
    render(<InvoiceSummary {...defaultProps} readonly />);

    const discountField = screen.getByLabelText("Descuento (%)");
    const taxField = screen.getByLabelText("Impuesto (%)");
    expect(discountField).toBeDisabled();
    expect(taxField).toBeDisabled();
  });

  it("given editable mode, when changing discount, then calls onDiscountChange", async () => {
    const onDiscountChange = vi.fn();
    const user = userEvent.setup();
    render(<InvoiceSummary {...defaultProps} onDiscountChange={onDiscountChange} />);

    const discountField = screen.getByLabelText("Descuento (%)");
    await user.clear(discountField);
    await user.type(discountField, "15");

    expect(onDiscountChange).toHaveBeenCalled();
  });
});
