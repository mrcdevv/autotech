import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { DeliveryNoteSummary } from "./DeliveryNoteSummary";

const money = (value: number) =>
  value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

describe("DeliveryNoteSummary", () => {
  const defaultProps = {
    servicesSubtotal: 500,
    productsSubtotal: 300,
    discountPercentage: 0,
    onDiscountChange: vi.fn(),
  };

  it("given subtotals, when rendered, then displays correct total", () => {
    render(<DeliveryNoteSummary {...defaultProps} />);

    expect(screen.getByText("Subtotal servicios")).toBeInTheDocument();
    expect(screen.getByText(`$ ${money(500)}`)).toBeInTheDocument();
    expect(screen.getByText(`$ ${money(300)}`)).toBeInTheDocument();
    expect(screen.getAllByText(`$ ${money(800)}`)).toHaveLength(2);
  });

  it("given discount, when rendered, then displays correct final price", () => {
    render(<DeliveryNoteSummary {...defaultProps} discountPercentage={10} />);

    expect(screen.getByText(`$ ${money(720)}`)).toBeInTheDocument();
  });

  it("given readonly mode, when rendered, then disables discount field", () => {
    render(<DeliveryNoteSummary {...defaultProps} readonly />);

    const discountField = screen.getByLabelText("Descuento (%)");
    expect(discountField).toBeDisabled();
  });

  it("given editable mode, when changing discount, then calls onDiscountChange", async () => {
    const onDiscountChange = vi.fn();
    const user = userEvent.setup();
    render(<DeliveryNoteSummary {...defaultProps} onDiscountChange={onDiscountChange} />);

    const discountField = screen.getByLabelText("Descuento (%)");
    await user.clear(discountField);
    await user.type(discountField, "15");

    expect(onDiscountChange).toHaveBeenCalled();
  });
});
