import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PendingEstimateAlerts } from "./PendingEstimateAlerts";
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

describe("PendingEstimateAlerts", () => {
  it("given alerts, when rendered, then shows estimate details", () => {
    const alerts = [
      {
        estimateId: 1,
        clientFullName: "Maria Garcia",
        vehiclePlate: "XYZ789",
        total: 25000,
        daysPending: 7,
      },
    ];

    render(<PendingEstimateAlerts alerts={alerts} thresholdDays={5} />);

    expect(screen.getByText(/Maria Garcia/)).toBeInTheDocument();
    expect(screen.getByText("7 días")).toBeInTheDocument();
  });

  it("given no alerts, when rendered, then shows empty state", () => {
    render(<PendingEstimateAlerts alerts={[]} thresholdDays={5} />);

    expect(screen.getByText("No hay presupuestos pendientes")).toBeInTheDocument();
  });

  it("given alerts, when rendered, then the amount is right-aligned on a block container", () => {
    const alerts = [
      {
        estimateId: 1,
        clientFullName: "Maria Garcia",
        vehiclePlate: "XYZ789",
        total: 25000.5,
        daysPending: 7,
      },
    ];

    render(<PendingEstimateAlerts alerts={alerts} thresholdDays={5} />);

    expectRightAlignedInBlock(screen.getByText(money(25000.5)));
  });
});
