import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { FinancieroTab } from "./FinancieroTab";
import { formatCurrency } from "@/utils/formatCurrency";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

// text-align has no effect on inline elements (CSS 2.1 §16.2), so an aligned amount must
// live inside a BLOCK-level container. Walk up from the amount element to the nearest
// container that carries the alignment, assert it is right-aligned, and explicitly guard
// that it is not an inline element where the alignment would be a no-op.
// NOTE: in jsdom, getComputedStyle().display is "" (not "inline") for elements that carry
// no author display rule, so the literal display check alone never fails; the inline-tag
// check below is what actually catches an inline-element alignment no-op.
const INLINE_TAGS = new Set(["SPAN", "A", "B", "I", "EM", "STRONG", "CODE", "SMALL", "LABEL", "U", "S"]);

function expectRightAlignedInBlock(element: HTMLElement): void {
  let node: HTMLElement | null = element;
  while (node) {
    const style = getComputedStyle(node);
    if (style.textAlign === "right") {
      expect(style.display === "inline" || INLINE_TAGS.has(node.tagName)).toBe(false);
      return;
    }
    node = node.parentElement;
  }
  throw new Error(`no right-aligned container found for: ${element.textContent}`);
}

vi.mock("@/features/dashboard/hooks/useFinanciero", () => ({
  useFinanciero: () => ({
    data: {
      monthlyRevenue: [{ year: 2026, month: 1, total: 50000 }],
      estimateConversionRate: 80,
      estimatesAccepted: 8,
      estimatesTotal: 10,
      totalPendingBilling: 15000,
      debtAging: [
        { range: "0-30", invoiceCount: 2, totalAmount: 5000 },
        { range: "31-60", invoiceCount: 1, totalAmount: 3000 },
        { range: "61-90", invoiceCount: 0, totalAmount: 0 },
        { range: "90+", invoiceCount: 0, totalAmount: 0 },
      ],
      topUnpaidInvoices: [],
    },
    loading: false,
    error: null,
    exportToExcel: vi.fn(),
  }),
}));

vi.mock("@mui/x-charts/BarChart", () => ({
  BarChart: () => <div data-testid="bar-chart">BarChart</div>,
}));

describe("FinancieroTab", () => {
  it("given data loaded, when rendered, then shows conversion rate and export button", () => {
    render(<FinancieroTab />);

    expect(screen.getByText("80.0%")).toBeInTheDocument();
    expect(screen.getByText("Exportar a Excel")).toBeInTheDocument();
    expect(screen.getByText("Antigüedad de deuda")).toBeInTheDocument();
  });

  it("given data loaded, when rendered, then shows debt aging table", () => {
    render(<FinancieroTab />);

    expect(screen.getByText("0-30")).toBeInTheDocument();
    expect(screen.getByText("31-60")).toBeInTheDocument();
  });

  it("given data loaded, when rendered, then the pending billing amount is right-aligned on a block container", () => {
    render(<FinancieroTab />);

    expectRightAlignedInBlock(screen.getByText(money(15000)));
  });
});
