import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { MemoryRouter } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { EstimateDetail } from "./EstimateDetail";
import { useEstimate } from "@/features/estimates/hooks/useEstimate";
import { formatCurrency } from "@/utils/formatCurrency";

import type { EstimateDetailResponse, EstimateResponse } from "@/types/estimate";

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
    reopenEstimate: vi.fn(),
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

// ── Reopen an accepted estimate ("Revisar presupuesto") ──

function detailEstimate(overrides: Partial<EstimateDetailResponse> = {}): EstimateDetailResponse {
  return {
    id: 3,
    clientId: 1,
    clientFullName: "Juan Perez",
    clientDni: null,
    clientPhone: "555-1234",
    clientEmail: null,
    vehicleId: 1,
    vehiclePlate: "AB123CD",
    vehicleBrand: "Chevrolet",
    vehicleModel: "Corsa",
    vehicleYear: 2010,
    repairOrderId: 5,
    mechanicNotes: null,
    inspectionIssues: [],
    status: "ACEPTADO",
    discountPercentage: 0,
    taxPercentage: 0,
    total: 1000,
    services: [{ id: 1, serviceName: "Cambio de aceite", price: 800 }],
    products: [{ id: 1, productName: "Filtro de aceite", quantity: 1, unitPrice: 200, totalPrice: 200 }],
    createdAt: "2025-03-01T10:00:00",
    updatedAt: "2025-03-01T10:00:00",
    ...overrides,
  };
}

function axiosRefusal(message: string): AxiosError {
  return new AxiosError(
    "Request failed with status code 409",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      data: { message },
      status: 409,
      statusText: "Conflict",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    } as AxiosResponse,
  );
}

function mockDetailUseEstimate(
  getEstimate: () => EstimateDetailResponse,
  reopenEstimate: ReturnType<typeof vi.fn> = vi.fn(),
): ReturnType<typeof vi.fn> {
  const mocked = vi.fn(() => ({
    estimate: getEstimate(),
    allEstimates: [],
    noActiveEstimate: false,
    loading: false,
    error: null,
    clearError: vi.fn(),
    createEstimate: vi.fn(),
    updateEstimate: vi.fn(),
    approveEstimate: vi.fn(),
    rejectEstimate: vi.fn(),
    reopenEstimate,
    refetch: vi.fn(),
  }));
  vi.mocked(useEstimate).mockImplementation(mocked);
  return reopenEstimate;
}

const REOPEN_BUTTON = "Revisar presupuesto";
const REOPEN_CONFIRM = "Revisar";

describe("EstimateDetail (reopen accepted estimate)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given an accepted estimate, when rendered, then shows the reopen action", () => {
    // Stable identity across renders: EstimateDetail re-populates its form state from
    // `estimate` in an effect, so a getter returning a fresh object every render would
    // loop forever.
    const estimate = detailEstimate({ status: "ACEPTADO" });
    mockDetailUseEstimate(() => estimate);

    render(
      <MemoryRouter>
        <EstimateDetail estimateId={3} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: REOPEN_BUTTON })).toBeInTheDocument();
  });

  it("given a pending estimate, when rendered, then does not show the reopen action", () => {
    const estimate = detailEstimate({ status: "PENDIENTE" });
    mockDetailUseEstimate(() => estimate);

    render(
      <MemoryRouter>
        <EstimateDetail estimateId={3} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: REOPEN_BUTTON })).not.toBeInTheDocument();
  });

  it("given a rejected estimate, when rendered, then does not show the reopen action", () => {
    const estimate = detailEstimate({ status: "RECHAZADO" });
    mockDetailUseEstimate(() => estimate);

    render(
      <MemoryRouter>
        <EstimateDetail estimateId={3} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: REOPEN_BUTTON })).not.toBeInTheDocument();
  });

  it("given an accepted estimate attached to a repair order, when the reopen dialog opens, then the message mentions the invoice restriction", async () => {
    const user = userEvent.setup();
    const estimate = detailEstimate({ status: "ACEPTADO", repairOrderId: 5 });
    mockDetailUseEstimate(() => estimate);

    render(
      <MemoryRouter>
        <EstimateDetail estimateId={3} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: REOPEN_BUTTON }));

    expect(screen.getByText(/volverá al estado Pendiente/)).toBeInTheDocument();
    expect(
      screen.getByText(/mientras la orden de trabajo no tenga una factura asociada/),
    ).toBeInTheDocument();
  });

  it("given a standalone accepted estimate, when the reopen dialog opens, then the message does not mention a repair order", async () => {
    const user = userEvent.setup();
    const estimate = detailEstimate({ status: "ACEPTADO", repairOrderId: null });
    mockDetailUseEstimate(() => estimate);

    render(
      <MemoryRouter>
        <EstimateDetail estimateId={3} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: REOPEN_BUTTON }));

    expect(screen.getByText(/volverá al estado Pendiente/)).toBeInTheDocument();
    expect(screen.queryByText(/orden de trabajo/i)).not.toBeInTheDocument();
  });

  it("given an accepted estimate, when the reopen is confirmed, then the reopen endpoint is called and the view ends up pending and editable", async () => {
    const user = userEvent.setup();
    let current = detailEstimate({ status: "ACEPTADO" });
    const reopenEstimate = vi.fn(async () => {
      // Simulates the hook refetching the estimate after a successful reopen.
      current = detailEstimate({ status: "PENDIENTE" });
      return current;
    });
    mockDetailUseEstimate(() => current, reopenEstimate);

    render(
      <MemoryRouter>
        <EstimateDetail estimateId={3} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: REOPEN_BUTTON }));
    await user.click(screen.getByRole("button", { name: REOPEN_CONFIRM }));

    expect(reopenEstimate).toHaveBeenCalledWith(3);
    expect(await screen.findByText("Pendiente")).toBeInTheDocument();
    const saveButton = await screen.findByRole("button", { name: "Guardar" });
    await waitFor(() => expect(saveButton).toBeEnabled());
    expect(screen.queryByRole("button", { name: REOPEN_BUTTON })).not.toBeInTheDocument();
  });

  it("given the backend refuses the reopen, when the reopen is confirmed, then the refusal message is shown to the user", async () => {
    const user = userEvent.setup();
    const refusalMessage =
      "No se puede reabrir el presupuesto porque la orden de trabajo ya tiene una factura asociada";
    const reopenEstimate = vi.fn(async () => {
      throw axiosRefusal(refusalMessage);
    });
    const estimate = detailEstimate({ status: "ACEPTADO" });
    mockDetailUseEstimate(() => estimate, reopenEstimate);

    render(
      <MemoryRouter>
        <EstimateDetail estimateId={3} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: REOPEN_BUTTON }));
    await user.click(screen.getByRole("button", { name: REOPEN_CONFIRM }));

    expect(await screen.findByText(refusalMessage)).toBeInTheDocument();
    // findByRole (not getByRole): the dialog is still in its MUI exit transition at this
    // point, which keeps the page content aria-hidden until it unmounts.
    expect(await screen.findByRole("button", { name: REOPEN_BUTTON })).toBeInTheDocument();
  });
});
