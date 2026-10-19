import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ProductsGrid } from "./ProductsGrid";
import { CURRENCY_SYMBOL } from "@/components/MoneyInput";
import { formatCurrency } from "@/utils/formatCurrency";

import type { DeliveryNoteProductRequest } from "@/types/deliveryNote";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

vi.mock("@/api/products", () => ({
  productsApi: {
    search: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
  },
}));

describe("ProductsGrid", () => {
  const defaultProducts: DeliveryNoteProductRequest[] = [
    { productName: "Brake pad", quantity: 4, unitPrice: 25 },
    { productName: "Oil filter", quantity: 1, unitPrice: 15 },
  ];

  it("given products, when rendered, then shows subtotal", () => {
    render(<ProductsGrid products={defaultProducts} onChange={vi.fn()} />);

    expect(screen.getByText("Subtotal productos:")).toBeInTheDocument();
    expect(screen.getByText(money(115))).toBeInTheDocument();
  });

  it("given products, when rendered, then the subtotal amount is explicitly right-aligned", () => {
    render(<ProductsGrid products={defaultProducts} onChange={vi.fn()} />);

    // 4*25 + 1*15 = 115
    const element = screen.getByText(money(115));
    expect(getComputedStyle(element).textAlign).toBe("right");
  });

  it("given products, when clicking add, then calls onChange with new row", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ProductsGrid products={defaultProducts} onChange={onChange} />);

    await user.click(screen.getByText("Agregar"));

    expect(onChange).toHaveBeenCalledWith([
      ...defaultProducts,
      { productName: "", quantity: 1, unitPrice: 0 },
    ]);
  });

  it("given readonly mode, when rendered, then hides add button", () => {
    render(<ProductsGrid products={defaultProducts} onChange={vi.fn()} readonly />);

    expect(screen.queryByText("Agregar")).not.toBeInTheDocument();
  });

  it("given products, when rendered, then shows Productos title", () => {
    render(<ProductsGrid products={defaultProducts} onChange={vi.fn()} />);

    expect(screen.getByText("Productos")).toBeInTheDocument();
  });

  it("given a unit price input, when not focused it shows the shared 2-decimal currency value and when focused the symbol followed by the plain number (decision D15, supersedes the D14 symbol-less focus state)", async () => {
    const user = userEvent.setup();
    render(
      <ProductsGrid
        products={[{ productName: "Align check", quantity: 2, unitPrice: 1234.5 }]}
        onChange={vi.fn()}
      />,
    );

    const priceInput = screen.getByLabelText("Precio unitario");
    // Not focused: exactly the shared formatter output (2 decimals, single "$"),
    // never a raw "1234.5".
    expect(priceInput).toHaveValue(formatCurrency(1234.5));
    // Positive assertion: the inline style is reflected in jsdom's getComputedStyle.
    expect(getComputedStyle(priceInput).textAlign).toBe("right");

    await user.click(priceInput);
    // D15: while focused the symbol STAYS, adjacent to the plain number being
    // edited — only the thousands separator and decimal separator are dropped.
    expect(priceInput).toHaveValue(CURRENCY_SYMBOL + "1234.5");
  });
});
