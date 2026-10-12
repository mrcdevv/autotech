import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ProductsGrid } from "./ProductsGrid";
import { formatCurrency } from "@/utils/formatCurrency";

import type { EstimateProductRequest } from "@/types/estimate";

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
  const defaultProducts: EstimateProductRequest[] = [
    { productName: "Brake pad", quantity: 4, unitPrice: 25 },
    { productName: "Oil filter", quantity: 1, unitPrice: 15 },
  ];

  it("given products, when rendered, then shows subtotal", () => {
    render(<ProductsGrid products={defaultProducts} onChange={vi.fn()} />);

    // 4*25 + 1*15 = 115
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

  it("given a unit price input, when rendered, then the input is right-aligned but its value stays the raw editable number (decision D5)", () => {
    render(
      <ProductsGrid
        products={[{ productName: "Align check", quantity: 2, unitPrice: 1234.5 }]}
        onChange={vi.fn()}
      />,
    );

    const priceInput = screen.getByLabelText("Precio unitario");
    // Positive assertion: the inline style is reflected in jsdom's getComputedStyle.
    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    // D5 guard: the value must be the raw number the user is typing, never a
    // currency string like "$ 1.234,50".
    expect(priceInput).toHaveValue(1234.5);
  });
});
