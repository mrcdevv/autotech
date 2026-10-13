import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { DailyCash } from "./DailyCash";
import { buildDailyCash } from "../utils/homeView";
import { formatCurrency } from "@/utils/formatCurrency";

import type { DeliveryNoteResponse } from "@/types/deliveryNote";

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

const todayIso = () => new Date().toISOString();

const deliveryNote = (id: number, status: DeliveryNoteResponse["status"], total: number): DeliveryNoteResponse => ({
  id,
  number: id,
  clientId: 1,
  clientFullName: "Juan Perez",
  vehicleId: null,
  vehiclePlate: null,
  vehicleModel: null,
  repairOrderId: null,
  estimateId: null,
  status,
  discountPercentage: 0,
  total,
  createdAt: todayIso(),
  updatedAt: todayIso(),
});

// The view is built with the real buildDailyCash so the rendered decimals are
// discriminated end to end: 1234.5 renders "$ 1.234,50" (2 decimals, D3), not the
// chart-axis "$ 1.235" that formatCurrencyWhole would produce.
const cash = buildDailyCash([deliveryNote(1, "PAGADA", 1234.5), deliveryNote(2, "PENDIENTE", 226.8)]);

describe("DailyCash", () => {
  it("given today's cash, when rendered, then the total carries exactly 2 decimals", () => {
    render(<DailyCash cash={cash} />);

    expect(screen.getByText(money(1234.5))).toBeInTheDocument();
  });

  it("given today's cash, when rendered, then the pending total carries exactly 2 decimals", () => {
    render(<DailyCash cash={cash} />);

    expect(screen.getByText(/pendiente/)).toHaveTextContent(money(226.8));
  });

  it("given today's cash, when rendered, then the total amount is right-aligned on a block container", () => {
    render(<DailyCash cash={cash} />);

    expectRightAlignedInBlock(screen.getByText(money(1234.5)));
  });

  it("given today's cash, when rendered, then the pending amounts line is right-aligned on a block container", () => {
    render(<DailyCash cash={cash} />);

    const line = screen.getByText(/remitos cobradas|remito cobrada/);
    expect(getComputedStyle(line).textAlign).toBe("right");
    expect(INLINE_TAGS.has(line.tagName)).toBe(false);
  });
});
