import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { GeneralInfoTab } from "./GeneralInfoTab";
import { formatCurrency } from "@/utils/formatCurrency";

import type { RepairOrderDetailResponse } from "../types";
import type { EstimateResponse } from "@/types/estimate";
import type { DeliveryNoteDetailResponse } from "@/types/deliveryNote";
import type { PaymentSummaryResponse } from "@/types/payment";

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
// check below is what actually catches the pre-fix bug of textAlign on a MonoText span.
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

const mockGetAllEstimatesByRepairOrderId = vi.fn();
const mockGetDeliveryNoteByRepairOrderId = vi.fn();
const mockGetPaymentSummary = vi.fn();

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: () => <div data-testid="mock-datagrid" />,
}));

vi.mock("./EditRepairOrderDialog", () => ({
  EditRepairOrderDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-repair-order-dialog" /> : null,
}));

vi.mock("@/api/estimates", () => ({
  estimatesApi: {
    getAllByRepairOrderId: (...args: unknown[]) => mockGetAllEstimatesByRepairOrderId(...args),
  },
}));

vi.mock("@/api/deliveryNotes", () => ({
  deliveryNotesApi: {
    getByRepairOrderId: (...args: unknown[]) => mockGetDeliveryNoteByRepairOrderId(...args),
  },
}));

vi.mock("@/api/payments", () => ({
  paymentsApi: {
    getSummary: (...args: unknown[]) => mockGetPaymentSummary(...args),
  },
}));

// Default wiring: the API calls fail, so the financial summary shows empty states.
// (Before this file mocked the API modules, the real HTTP calls rejected in jsdom.)
mockGetAllEstimatesByRepairOrderId.mockRejectedValue(new Error("network"));
mockGetDeliveryNoteByRepairOrderId.mockRejectedValue(new Error("network"));
mockGetPaymentSummary.mockRejectedValue(new Error("network"));

const sampleOrder: RepairOrderDetailResponse = {
  id: 1,
  title: "OT-1 Perez - ABC123",
  status: "INGRESO_VEHICULO",
  reason: "Engine noise",
  clientSource: null,
  mechanicNotes: null,
  appointmentId: null,
  clientId: 1,
  clientFirstName: "Juan",
  clientLastName: "Perez",
  clientDni: "12345678",
  clientPhone: "1234567890",
  clientEmail: "juan@test.com",
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleBrandName: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
  vehicleChassisNumber: "CHASSIS001",
  employees: [],
  tags: [],
  workHistory: [
    { repairOrderId: 1, repairOrderTitle: "OT-1", reason: "Engine noise", createdAt: "2025-01-15T10:00:00" },
  ],
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

describe("GeneralInfoTab", () => {
  it("given order, when rendered, then shows status and reason", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("Ingreso")).toBeInTheDocument();
    expect(screen.getByText("Engine noise")).toBeInTheDocument();
  });

  it("given order, when rendered, then shows summary and notes sections", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("Resumen Financiero")).toBeInTheDocument();
    expect(screen.getByText("Motivo y Notas")).toBeInTheDocument();
  });

  it("given order, when rendered, then shows work history section", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("Historial de Trabajo")).toBeInTheDocument();
    expect(screen.getByTestId("mock-datagrid")).toBeInTheDocument();
  });

  it("given order without employees, when rendered, then shows assign action", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /asignar/i })).toBeInTheDocument();
  });

  it("given order with employees, when rendered, then shows edit action", () => {
    render(
      <GeneralInfoTab
        order={{ ...sampleOrder, employees: [{ id: 1, firstName: "Carlos", lastName: "Lopez" }] }}
        loading={false}
        onRefetch={vi.fn()}
      />,
    );

    // Exact name: only the mechanics action is bare "Editar"; the order edit
    // button is labelled "Editar orden de trabajo".
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("given order, when rendered, then shows edit action for the order details", () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Editar orden de trabajo" })).toBeInTheDocument();
  });

  it("given edit action clicked, then opens the edit dialog", async () => {
    const user = userEvent.setup();
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Editar orden de trabajo" }));

    expect(screen.getByTestId("edit-repair-order-dialog")).toBeInTheDocument();
  });

  it("given null order, when rendered, then shows not found message", () => {
    render(<GeneralInfoTab order={null} loading={false} onRefetch={vi.fn()} />);

    expect(screen.getByText("No se encontró la orden de trabajo")).toBeInTheDocument();
  });

  it("given loading state, when rendered, then shows spinner", () => {
    const { container } = render(<GeneralInfoTab order={null} loading={true} onRefetch={vi.fn()} />);

    expect(container.querySelector(".MuiCircularProgress-root")).toBeInTheDocument();
  });
});

const acceptedEstimate: EstimateResponse = {
  id: 5,
  clientId: 1,
  clientFullName: "Juan Perez",
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleModel: "Corolla",
  repairOrderId: 1,
  status: "ACEPTADO",
  discountPercentage: 0,
  taxPercentage: 0,
  // Three decimals on purpose: the shared formatter must render exactly two.
  total: 1234.567,
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

const deliveryNoteDetail: DeliveryNoteDetailResponse = {
  id: 9,
  number: 9,
  clientId: 1,
  clientFullName: "Juan Perez",
  clientDni: null,
  clientPhone: "1234567890",
  clientEmail: null,
  clientType: "REGISTERED",
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleBrand: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
  repairOrderId: 1,
  estimateId: 5,
  status: "PENDIENTE",
  discountPercentage: 0,
  total: 2234.567,
  services: [],
  products: [],
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

const paymentSummary: PaymentSummaryResponse = {
  totalServices: 0,
  totalProducts: 0,
  discountAmount: 0,
  total: 2234.567,
  totalPaid: 700.123,
  remaining: 434.567,
};

describe("GeneralInfoTab financial summary amounts", () => {
  beforeEach(() => {
    mockGetAllEstimatesByRepairOrderId.mockResolvedValue({ data: { data: [acceptedEstimate] } });
    mockGetDeliveryNoteByRepairOrderId.mockResolvedValue({ data: { data: deliveryNoteDetail } });
    mockGetPaymentSummary.mockResolvedValue({ data: { data: paymentSummary } });
  });

  it("given estimate, invoice and payments, when rendered, then amounts render with exactly two decimals", async () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    // These four sites already go through formatCurrency (T1), so the two-decimal
    // rendering holds; this test pins it as a regression guard.
    expect(await screen.findByText(money(1234.567))).toBeInTheDocument(); // Presupuesto
    expect(screen.getByText(money(2234.567))).toBeInTheDocument(); // Factura
    expect(screen.getByText(money(700.123))).toBeInTheDocument(); // Pagos
    expect(screen.getByText(money(434.567))).toBeInTheDocument(); // Saldo
  });

  it("given estimate, invoice and payments, when rendered, then the four amounts are right-aligned inside block-level containers", async () => {
    render(<GeneralInfoTab order={sampleOrder} loading={false} onRefetch={vi.fn()} />);

    const amounts = [money(1234.567), money(2234.567), money(700.123), money(434.567)];
    for (const amount of amounts) {
      const element = await screen.findByText(amount);
      expectRightAlignedInBlock(element);
    }
  });
});
