import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PaymentSummary } from "./PaymentSummary";

import type { PaymentSummaryResponse } from "@/types/payment";

const buildSummary = (overrides?: Partial<PaymentSummaryResponse>): PaymentSummaryResponse => ({
  totalServices: 1000,
  totalProducts: 200,
  discountAmount: 120,
  total: 1080,
  totalPaid: 500,
  remaining: 580,
  ...overrides,
});

describe("PaymentSummary", () => {
  it("given summary data, when rendered, then displays all fields correctly", () => {
    render(<PaymentSummary summary={buildSummary()} />);

    expect(screen.getByText("$1000.00")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    expect(screen.getByText("-$120.00")).toBeInTheDocument();
    expect(screen.getByText("$1080.00")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText("$580.00")).toBeInTheDocument();
  });

  it("given remaining > 0, when rendered, then remaining label is visible", () => {
    render(<PaymentSummary summary={buildSummary({ remaining: 580 })} />);

    expect(screen.getByText("Restante por pagar:")).toBeInTheDocument();
    expect(screen.getByText("$580.00")).toBeInTheDocument();
  });

  it("given remaining = 0, when rendered, then remaining shows zero", () => {
    render(<PaymentSummary summary={buildSummary({ remaining: 0, totalPaid: 1080 })} />);

    expect(screen.getByText("Restante por pagar:")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("given null summary, when rendered, then shows nothing", () => {
    const { container } = render(<PaymentSummary summary={null} />);

    expect(container.innerHTML).toBe("");
  });
});
