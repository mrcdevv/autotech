import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PaymentSummary } from "./PaymentSummary";
import { formatCurrency } from "@/utils/formatCurrency";

import type { PaymentSummaryResponse } from "@/types/payment";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

const buildSummary = (overrides?: Partial<PaymentSummaryResponse>): PaymentSummaryResponse => ({
  totalServices: 1000,
  totalProducts: 200,
  taxAmount: 226.8,
  discountAmount: 120,
  total: 1306.8,
  totalPaid: 500,
  remaining: 806.8,
  ...overrides,
});

describe("PaymentSummary", () => {
  it("given summary data, when rendered, then displays all fields correctly", () => {
    render(<PaymentSummary summary={buildSummary()} />);

    expect(screen.getByText(money(1000))).toBeInTheDocument();
    expect(screen.getByText(money(200))).toBeInTheDocument();
    expect(screen.getByText(money(226.8))).toBeInTheDocument();
    expect(screen.getByText(`-${money(120)}`)).toBeInTheDocument();
    expect(screen.getByText(money(1306.8))).toBeInTheDocument();
    expect(screen.getByText(money(500))).toBeInTheDocument();
    expect(screen.getByText(money(806.8))).toBeInTheDocument();
  });

  it("given amounts, when rendered, then every amount element is explicitly right-aligned", () => {
    render(<PaymentSummary summary={buildSummary()} />);

    const amounts = [
      money(1000), // Total en servicios
      money(200), // Total en partes
      money(226.8), // Impuestos
      `-${money(120)}`, // Descuento
      money(1306.8), // Total
      money(500), // Total pagado a la fecha
      money(806.8), // Restante por pagar
    ];
    for (const amount of amounts) {
      const element = screen.getByText(amount);
      expect(getComputedStyle(element).textAlign).toBe("right");
    }
  });

  it("given remaining > 0, when rendered, then remaining label is visible", () => {
    render(<PaymentSummary summary={buildSummary({ remaining: 806.8 })} />);

    expect(screen.getByText("Restante por pagar:")).toBeInTheDocument();
    expect(screen.getByText(money(806.8))).toBeInTheDocument();
  });

  it("given remaining = 0, when rendered, then remaining shows zero", () => {
    render(<PaymentSummary summary={buildSummary({ remaining: 0, totalPaid: 1306.8 })} />);

    expect(screen.getByText("Restante por pagar:")).toBeInTheDocument();
    expect(screen.getByText(money(0))).toBeInTheDocument();
  });

  it("given null summary, when rendered, then shows nothing", () => {
    const { container } = render(<PaymentSummary summary={null} />);

    expect(container.innerHTML).toBe("");
  });
});
