import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ServicesGrid } from "./ServicesGrid";
import { formatCurrency } from "@/utils/formatCurrency";

import type { InvoiceServiceItemRequest } from "@/types/invoice";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

vi.mock("@/api/catalogServices", () => ({
  catalogServicesApi: {
    search: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
  },
}));

describe("ServicesGrid", () => {
  const defaultServices: InvoiceServiceItemRequest[] = [
    { serviceName: "Oil change", price: 100 },
    { serviceName: "Brake inspection", price: 200 },
  ];

  it("given services, when rendered, then shows subtotal", () => {
    render(<ServicesGrid services={defaultServices} onChange={vi.fn()} />);

    expect(screen.getByText("Subtotal servicios:")).toBeInTheDocument();
    expect(screen.getByText(money(300))).toBeInTheDocument();
  });

  it("given services, when clicking add, then calls onChange with new row", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ServicesGrid services={defaultServices} onChange={onChange} />);

    await user.click(screen.getByText("Agregar"));

    expect(onChange).toHaveBeenCalledWith([
      ...defaultServices,
      { serviceName: "", price: 0 },
    ]);
  });

  it("given readonly mode, when rendered, then hides add and delete buttons", () => {
    render(<ServicesGrid services={defaultServices} onChange={vi.fn()} readonly />);

    expect(screen.queryByText("Agregar")).not.toBeInTheDocument();
  });

  it("given services, when rendered, then shows Servicios title", () => {
    render(<ServicesGrid services={defaultServices} onChange={vi.fn()} />);

    expect(screen.getByText("Servicios")).toBeInTheDocument();
  });
});
