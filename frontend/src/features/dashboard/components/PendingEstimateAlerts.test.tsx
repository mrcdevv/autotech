import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
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

function LocationProbe({ onLocation }: { onLocation: (pathname: string) => void }) {
  const location = useLocation();
  onLocation(location.pathname);
  return null;
}

describe("PendingEstimateAlerts", () => {
  const alerts = [
    {
      estimateId: 1,
      clientFullName: "Maria Garcia",
      vehiclePlate: "XYZ789",
      total: 25000,
      daysPending: 7,
    },
    {
      estimateId: 2,
      clientFullName: "Maria Garcia",
      vehiclePlate: "LMN456",
      total: 25000,
      daysPending: 7,
    },
  ];

  it("given alerts, when rendered, then shows estimate details", () => {
    render(
      <MemoryRouter>
        <PendingEstimateAlerts alerts={alerts.slice(0, 1)} thresholdDays={5} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Maria Garcia/)).toBeInTheDocument();
    expect(screen.getByText("7 días")).toBeInTheDocument();
  });

  it("given alerts, when rendered, then each row is a link to its estimate", () => {
    render(
      <MemoryRouter>
        <PendingEstimateAlerts alerts={[...alerts]} thresholdDays={5} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /presupuesto #1/i })).toHaveAttribute(
      "href",
      "/presupuestos/1",
    );
    expect(screen.getByRole("link", { name: /presupuesto #2/i })).toHaveAttribute(
      "href",
      "/presupuestos/2",
    );
  });

  it("given alerts, when a row is clicked, then it navigates to the referenced estimate", async () => {
    let pathname = "";
    const onLocation = (value: string) => {
      pathname = value;
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocationProbe onLocation={onLocation} />
        <PendingEstimateAlerts alerts={alerts} thresholdDays={5} />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("link", { name: /presupuesto #1/i }));

    expect(pathname).toBe("/presupuestos/1");
  });

  it("given no alerts, when rendered, then shows empty state", () => {
    render(
      <MemoryRouter>
        <PendingEstimateAlerts alerts={[]} thresholdDays={5} />
      </MemoryRouter>,
    );

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

    render(
      <MemoryRouter>
        <PendingEstimateAlerts alerts={alerts} thresholdDays={5} />
      </MemoryRouter>,
    );

    expectRightAlignedInBlock(screen.getByText(money(25000.5)));
  });
});
