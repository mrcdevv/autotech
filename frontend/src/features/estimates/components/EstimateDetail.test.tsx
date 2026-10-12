import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { EstimateDetail } from "./EstimateDetail";
import { useEstimate } from "@/features/estimates/hooks/useEstimate";
import { formatCurrency } from "@/utils/formatCurrency";

import type { EstimateResponse } from "@/types/estimate";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

// text-align has no effect on inline elements (CSS 2.1 §16.2), so an aligned amount must
// live inside a BLOCK-level container. Walk up from the amount element to the nearest
// container that carries the alignment, assert it is right-aligned, and explicitly guard
// that it is not an inline element where the alignment would be a no-op (decision D13:
// the inline-tag check is what catches the no-op, not the computed style).
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

vi.mock("@/features/estimates/hooks/useEstimate", () => ({
  useEstimate: vi.fn(),
}));

vi.mock("@/api/inspections", () => ({
  inspectionsApi: {
    // Never resolves: the inspection-issue fetch is irrelevant to the banner tests and
    // this avoids a post-render state update (act warning).
    getByRepairOrder: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}));

const rejectedEstimate = (total: number | null): EstimateResponse => ({
  id: 9,
  clientId: 1,
  clientFullName: "Juan Perez",
  vehicleId: 1,
  vehiclePlate: "AB123CD",
  vehicleModel: "Corsa",
  repairOrderId: 5,
  status: "RECHAZADO",
  discountPercentage: 0,
  taxPercentage: 0,
  total,
  createdAt: "2025-03-01T10:00:00",
  updatedAt: "2025-03-01T10:00:00",
});

function mockUseEstimate(allEstimates: EstimateResponse[]): void {
  vi.mocked(useEstimate).mockReturnValue({
    estimate: null,
    allEstimates,
    noActiveEstimate: true,
    loading: false,
    error: null,
    clearError: vi.fn(),
    createEstimate: vi.fn(),
    updateEstimate: vi.fn(),
    approveEstimate: vi.fn(),
    rejectEstimate: vi.fn(),
    refetch: vi.fn(),
  });
}

function renderRejectedBanner(total: number | null): void {
  mockUseEstimate([rejectedEstimate(total)]);
  render(
    <MemoryRouter initialEntries={["/ordenes/5"]}>
      <EstimateDetail repairOrderId={5} />
    </MemoryRouter>,
  );
}

describe("EstimateDetail (rejected estimates banner)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given a rejected estimate with a single-decimal total, when rendered, then the amount shows exactly 2 decimals", () => {
    // A raw toLocaleString() without fraction digits renders 1234.5 as "$1.234,5";
    // the shared helper must render it with exactly 2 decimals.
    renderRejectedBanner(1234.5);

    expect(screen.getByText(money(1234.5))).toBeInTheDocument();
  });

  it("given a rejected estimate, when rendered, then the amount is right-aligned on a block carrier", () => {
    renderRejectedBanner(1234.5);

    expectRightAlignedInBlock(screen.getByText(money(1234.5)));
  });

  it("given a rejected estimate without total, when rendered, then the amount falls back to a dash", () => {
    renderRejectedBanner(null);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
