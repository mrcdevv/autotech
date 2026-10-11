import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ProductsGrid } from "./ProductsGrid";

import type { InvoiceProductRequest } from "@/types/invoice";

vi.mock("@/api/products", () => ({
  productsApi: {
    search: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
  },
}));

const money = (value: number) =>
  value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

describe("ProductsGrid", () => {
  const defaultProducts: InvoiceProductRequest[] = [
    { productName: "Brake pad", quantity: 4, unitPrice: 25 },
    { productName: "Oil filter", quantity: 1, unitPrice: 15 },
  ];

  it("given products, when rendered, then shows subtotal", () => {
    render(<ProductsGrid products={defaultProducts} onChange={vi.fn()} />);

    expect(screen.getByText("Subtotal productos:")).toBeInTheDocument();
    expect(screen.getByText(`$ ${money(115)}`)).toBeInTheDocument();
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
});
