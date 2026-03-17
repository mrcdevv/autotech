import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { ServicesGrid } from "./ServicesGrid";

import type { EstimateServiceItemRequest } from "@/types/estimate";

vi.mock("@/api/catalogServices", () => ({
  catalogServicesApi: {
    search: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
  },
}));

describe("ServicesGrid", () => {
  const defaultServices: EstimateServiceItemRequest[] = [
    { serviceName: "Oil change", price: 100 },
    { serviceName: "Brake inspection", price: 200 },
  ];

  it("given services, when rendered, then shows subtotal", () => {
    render(<ServicesGrid services={defaultServices} onChange={vi.fn()} />);

    expect(screen.getByText("Subtotal servicios: $300.00")).toBeInTheDocument();
  });

  it("given services, when clicking add, then calls onChange with new row", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ServicesGrid services={defaultServices} onChange={onChange} />);

    await user.click(screen.getByText("Agregar servicio"));

    expect(onChange).toHaveBeenCalledWith([
      ...defaultServices,
      { serviceName: "", price: 0 },
    ]);
  });

  it("given readonly mode, when rendered, then hides add and delete buttons", () => {
    render(<ServicesGrid services={defaultServices} onChange={vi.fn()} readonly />);

    expect(screen.queryByText("Agregar servicio")).not.toBeInTheDocument();
  });

  it("given services, when rendered, then shows Servicios title", () => {
    render(<ServicesGrid services={defaultServices} onChange={vi.fn()} />);

    expect(screen.getByText("Servicios")).toBeInTheDocument();
  });
});
