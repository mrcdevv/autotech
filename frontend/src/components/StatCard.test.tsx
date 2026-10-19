import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { StatCard } from "./StatCard";

// text-align has no effect on inline elements (CSS 2.1 §16.2), so an aligned amount must
// live inside a BLOCK-level container. Walk up from the value element to the nearest
// container that carries the alignment, and explicitly guard that it is not an inline
// element where the alignment would be a no-op.
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

// Honest "no alignment anywhere above the value" check: walks the ancestor chain and
// reports whether ANY container right-aligns. A negative assertion on a single computed
// style would be suspect in jsdom (decision D13), so the default case asserts the whole
// chain plus the DOM shape (the value still sits in the inline MonoText span).
function hasRightAlignedAncestor(element: HTMLElement): boolean {
  let node: HTMLElement | null = element;
  while (node) {
    if (getComputedStyle(node).textAlign === "right") return true;
    node = node.parentElement;
  }
  return false;
}

describe("StatCard", () => {
  it("by default, when rendered, then the value is NOT right-aligned and stays in the inline span", () => {
    render(<StatCard label="Vehículos en taller" value={3} />);

    const value = screen.getByText("3");
    // Default output must stay byte-identical for every existing consumer: no alignment
    // carrier anywhere above the value, and the value still lives in the MonoText span.
    expect(hasRightAlignedAncestor(value)).toBe(false);
    expect(INLINE_TAGS.has(value.tagName)).toBe(true);
  });

  it("given alignValue right, when rendered, then the value is right-aligned on a BLOCK carrier", () => {
    render(<StatCard label="Facturación pendiente" value="1.234,50" alignValue="right" />);

    const value = screen.getByText("1.234,50");
    expectRightAlignedInBlock(value);
    // The carrier found by the walk-up must be a block element, not the inline span.
    const carrier = value.parentElement;
    expect(carrier).not.toBeNull();
    expect(INLINE_TAGS.has(carrier!.tagName)).toBe(false);
  });
});
