import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { InvoiceTab } from "./InvoiceTab";
import { formatCurrency } from "@/utils/formatCurrency";

import type { EstimateDetailResponse } from "@/types/estimate";

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

const mockGetInvoiceByRepairOrderId = vi.fn();
const mockGetEstimateByRepairOrderId = vi.fn();
const mockGetAllEstimatesByRepairOrderId = vi.fn();

vi.mock("./InvoiceDetail", () => ({
  InvoiceDetail: ({ repairOrderId }: { repairOrderId: number }) => (
    <div data-testid="invoice-detail">InvoiceDetail for RO #{repairOrderId}</div>
  ),
}));

vi.mock("@/api/invoices", () => ({
  invoicesApi: {
    getByRepairOrderId: (...args: unknown[]) => mockGetInvoiceByRepairOrderId(...args),
  },
}));

vi.mock("@/api/estimates", () => ({
  estimatesApi: {
    getByRepairOrderId: (...args: unknown[]) => mockGetEstimateByRepairOrderId(...args),
    getAllByRepairOrderId: (...args: unknown[]) => mockGetAllEstimatesByRepairOrderId(...args),
  },
}));

// Default wiring preserved from the previous version of this file: an existing invoice
// (renders InvoiceDetail) and no estimate.
mockGetInvoiceByRepairOrderId.mockResolvedValue({ data: { data: { id: 1 } } });
mockGetEstimateByRepairOrderId.mockRejectedValue(new Error("no estimate"));
mockGetAllEstimatesByRepairOrderId.mockResolvedValue({ data: { data: [] } });

// Values deliberately carry three decimals: the shared formatter renders exactly two,
// while the legacy inline `$` + toLocaleString("es-AR", { minimumFractionDigits: 2 })
// (no maximumFractionDigits) rendered three under ECMA-402.
const pendingEstimate: EstimateDetailResponse = {
  id: 7,
  clientId: 1,
  clientFullName: "Juan Perez",
  clientDni: null,
  clientPhone: "1234567890",
  clientEmail: null,
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleBrand: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
  repairOrderId: 42,
  mechanicNotes: null,
  inspectionIssues: [],
  status: "PENDIENTE",
  discountPercentage: 0,
  taxPercentage: 0,
  total: 2000.123,
  services: [{ id: 1, serviceName: "Cambio de aceite", price: 500.678 }],
  products: [
    { id: 2, productName: "Filtro de aceite", quantity: 2, unitPrice: 617.28, totalPrice: 1234.567 },
  ],
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

describe("InvoiceTab", () => {
  it("given repairOrderId, when rendered, then passes it to InvoiceDetail", async () => {
    render(<InvoiceTab repairOrderId={42} />);

    expect(await screen.findByTestId("invoice-detail")).toBeInTheDocument();
    expect(screen.getByText("InvoiceDetail for RO #42")).toBeInTheDocument();
  });
});

describe("InvoiceTab estimate summary card amounts", () => {
  beforeEach(() => {
    mockGetInvoiceByRepairOrderId.mockRejectedValue(new Error("no invoice"));
    mockGetEstimateByRepairOrderId.mockResolvedValue({ data: { data: pendingEstimate } });
    mockGetAllEstimatesByRepairOrderId.mockResolvedValue({ data: { data: [] } });
  });

  it("given a pending estimate with values beyond two decimals, when rendered, then amounts render with exactly two decimals", async () => {
    render(<InvoiceTab repairOrderId={42} />);

    // The total, the service price and the product line total each carried three
    // decimals under the legacy inline formatting; the shared formatter rounds to two.
    expect(await screen.findByText(money(2000.123))).toBeInTheDocument();
    expect(screen.getByText(money(500.678))).toBeInTheDocument();
    expect(screen.getByText(money(1234.567))).toBeInTheDocument();
  });

  it("given a pending estimate, when rendered, then the three amounts are right-aligned inside block-level containers", async () => {
    render(<InvoiceTab repairOrderId={42} />);

    const amounts = [money(2000.123), money(500.678), money(1234.567)];
    for (const amount of amounts) {
      const element = await screen.findByText(amount);
      expectRightAlignedInBlock(element);
    }
  });

  it("given a pending estimate, when rendered, then the Total amount's aligned block actually spans the row's available space", async () => {
    render(<InvoiceTab repairOrderId={42} />);

    const total = await screen.findByText(money(2000.123));
    expectRightAlignedInBlock(total);
    // text-align only has a visual effect when the aligned block is wider than its
    // content. The amount's <p> fills its parent Box exactly, and that Box is a
    // content-sized flex item of the row Stack, so the alignment is decorative unless
    // the Box grows into the Stack's leftover space. Decision D13: assert the positive
    // inline flexGrow (jsdom reflects inline styles) instead of a negative rule check.
    const box = total.parentElement;
    expect(box).not.toBeNull();
    expect(box!.tagName).toBe("DIV");
    expect(getComputedStyle(box!).flexGrow).toBe("1");
  });
});
