import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PaymentSummary } from "./PaymentSummary";

import type { PaymentSummaryResponse } from "@/types/payment";

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

    expect(screen.getByText("$1000.00")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    expect(screen.getByText("$226.80")).toBeInTheDocument();
    expect(screen.getByText("-$120.00")).toBeInTheDocument();
    expect(screen.getByText("$1306.80")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText("$806.80")).toBeInTheDocument();
  });

  it("given remaining > 0, when rendered, then remaining label is visible", () => {
    render(<PaymentSummary summary={buildSummary({ remaining: 806.8 })} />);

    expect(screen.getByText("Restante por pagar:")).toBeInTheDocument();
    expect(screen.getByText("$806.80")).toBeInTheDocument();
  });

  it("given remaining = 0, when rendered, then remaining shows zero", () => {
    render(<PaymentSummary summary={buildSummary({ remaining: 0, totalPaid: 1306.8 })} />);

    expect(screen.getByText("Restante por pagar:")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("given null summary, when rendered, then shows nothing", () => {
    const { container } = render(<PaymentSummary summary={null} />);

    expect(container.innerHTML).toBe("");
  });
});
