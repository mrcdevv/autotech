import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, it, expect } from "vitest";

import { LowStockAlerts } from "./LowStockAlerts";

describe("LowStockAlerts", () => {
  it("given no alerts, when rendered, then shows the empty message", () => {
    render(
      <MemoryRouter>
        <LowStockAlerts alerts={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No hay productos con stock bajo")).toBeInTheDocument();
  });

  it("given low and negative stock, when rendered, then shows available versus minimum and the right badge", () => {
    render(
      <MemoryRouter>
        <LowStockAlerts
          alerts={[
            { productId: 1, productName: "Filtro de aceite", quantity: 3, reservedQuantity: 2, availableQuantity: 1, minStock: 4 },
            { productId: 2, productName: "Pastillas", quantity: -2, reservedQuantity: 0, availableQuantity: -2, minStock: 1 },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Filtro de aceite")).toBeInTheDocument();
    expect(screen.getByText("En stock 3 · Reservado 2")).toBeInTheDocument();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
    expect(screen.getByText("Bajo mínimo")).toBeInTheDocument();
    expect(screen.getByText("Stock negativo")).toBeInTheDocument();
  });
});
