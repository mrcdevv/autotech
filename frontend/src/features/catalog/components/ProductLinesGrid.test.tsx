import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { productsApi } from "@/api/products";
import { ProductLinesGrid } from "./ProductLinesGrid";

import type { ProductLine } from "./ProductLinesGrid";
import type { ProductResponse } from "@/types/catalog";

vi.mock("@/api/products", () => ({
  productsApi: {
    search: vi.fn(),
    getById: vi.fn(),
  },
}));

const oil: ProductResponse = {
  id: 7,
  name: "Aceite 5W30",
  description: null,
  quantity: 5,
  unitPrice: 100,
  createdAt: "",
  updatedAt: "",
  minStock: null,
  reservedQuantity: 2,
  availableQuantity: 3,
  lowStock: false,
};

describe("ProductLinesGrid", () => {
  beforeEach(() => {
    vi.mocked(productsApi.search).mockResolvedValue({ data: { data: { content: [oil] } } } as never);
    vi.mocked(productsApi.getById).mockResolvedValue({ data: { data: oil } } as never);
  });

  it("given an empty line, when a catalog product is picked, then stores its id, name and price", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ProductLinesGrid products={[{ productName: "", quantity: 1, unitPrice: 0 }]} onChange={onChange} />);

    await user.click(screen.getByLabelText("Producto"));
    await user.click(await screen.findByText("Aceite 5W30"));

    expect(onChange).toHaveBeenLastCalledWith([
      { productName: "Aceite 5W30", quantity: 1, unitPrice: 100, productId: 7 },
    ]);
  });

  it("given a linked line, when rendered, then shows the available stock", async () => {
    const lines: ProductLine[] = [{ productName: "Aceite 5W30", quantity: 2, unitPrice: 100, productId: 7 }];
    render(<ProductLinesGrid products={lines} onChange={vi.fn()} />);

    expect(await screen.findByText("Disponible: 3")).toBeInTheDocument();
  });

  it("given a linked line above the available stock, when rendered, then warns without blocking", async () => {
    const lines: ProductLine[] = [{ productName: "Aceite 5W30", quantity: 4, unitPrice: 100, productId: 7 }];
    render(<ProductLinesGrid products={lines} onChange={vi.fn()} />);

    expect(await screen.findByText("Supera el stock disponible (3)")).toBeInTheDocument();
  });

  it("given a line loaded from an existing document, when its product is not in the search results, then fetches it by id", async () => {
    vi.mocked(productsApi.search).mockResolvedValue({ data: { data: { content: [] } } } as never);
    const lines: ProductLine[] = [{ productName: "Aceite 5W30", quantity: 1, unitPrice: 100, productId: 7 }];
    render(<ProductLinesGrid products={lines} onChange={vi.fn()} />);

    await waitFor(() => expect(productsApi.getById).toHaveBeenCalledWith(7));
    expect(await screen.findByText("Disponible: 3")).toBeInTheDocument();
  });

  it("given a linked line, when the name is edited by hand, then the line becomes free text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const lines: ProductLine[] = [{ productName: "Aceite 5W30", quantity: 1, unitPrice: 100, productId: 7 }];
    render(<ProductLinesGrid products={lines} onChange={onChange} />);

    await user.type(screen.getByLabelText("Producto"), "X");

    expect(onChange).toHaveBeenLastCalledWith([
      { productName: "Aceite 5W30X", quantity: 1, unitPrice: 100, productId: null },
    ]);
  });

  it("given a free-text line, when rendered, then explains it does not move stock", () => {
    render(<ProductLinesGrid products={[{ productName: "Tornillos", quantity: 1, unitPrice: 5 }]} onChange={vi.fn()} />);

    expect(screen.getByText("Producto libre: no mueve stock")).toBeInTheDocument();
  });
});
