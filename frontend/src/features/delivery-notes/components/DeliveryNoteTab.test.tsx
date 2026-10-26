import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { DeliveryNoteTab } from "./DeliveryNoteTab";
import { deliveryNotesApi } from "@/api/deliveryNotes";
import { estimatesApi } from "@/api/estimates";
import { repairOrdersApi } from "@/api/repairOrders";

vi.mock("./DeliveryNoteDetail", () => ({
  DeliveryNoteDetail: ({
    repairOrderId,
    orderClientId,
    orderVehicleId,
  }: {
    repairOrderId?: number;
    orderClientId?: number;
    orderVehicleId?: number;
  }) => (
    <div
      data-testid="deliveryNote-detail"
      data-repair-order-id={repairOrderId}
      data-order-client-id={orderClientId}
      data-order-vehicle-id={orderVehicleId}
    >
      DeliveryNoteDetail for RO #{repairOrderId}
    </div>
  ),
}));

// Probe the shared container instead of its MUI internals: the assertion is that the
// tab renders its empty title, description and action INSIDE the shared EmptyState.
vi.mock("@/components/EmptyState", () => ({
  EmptyState: ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid="empty-state">
      <h6>{title}</h6>
      <p>{description}</p>
      {children}
    </div>
  ),
}));

vi.mock("@/api/deliveryNotes", () => ({
  deliveryNotesApi: {
    getByRepairOrderId: vi.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
  },
}));

// The attach dialog is probed through the props the tab passes it: the candidate
// request must be scoped to the order's client and vehicle identity.
vi.mock("./AttachDeliveryNoteDialog", () => ({
  AttachDeliveryNoteDialog: ({
    open,
    repairOrderId,
    clientId,
    vehicleId,
  }: {
    open?: boolean;
    repairOrderId?: number;
    clientId?: number;
    vehicleId?: number | null;
  }) =>
    open ? (
      <div
        data-testid="attach-delivery-note-dialog"
        data-repair-order-id={repairOrderId}
        data-client-id={clientId}
        data-vehicle-id={vehicleId ?? ""}
      />
    ) : null,
}));

vi.mock("@/api/estimates", () => ({
  estimatesApi: {
    getByRepairOrderId: vi.fn().mockRejectedValue(new Error("no estimate")),
    getAllByRepairOrderId: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

vi.mock("@/api/repairOrders", () => ({
  repairOrdersApi: {
    getById: vi.fn(),
  },
}));

describe("DeliveryNoteTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockResolvedValue({
      data: { data: { id: 1 } },
    } as never);
    vi.mocked(estimatesApi.getByRepairOrderId).mockRejectedValue(new Error("no estimate"));
    vi.mocked(estimatesApi.getAllByRepairOrderId).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(repairOrdersApi.getById).mockResolvedValue({
      data: {
        data: {
          id: 7,
          clientId: 3,
          clientFirstName: "Juan",
          clientLastName: "Perez",
          clientDni: "30123456",
          vehicleId: 9,
          vehiclePlate: "AB123CD",
          vehicleBrandName: "Toyota",
          vehicleModel: "Corolla",
          vehicleYear: 2015,
        },
      },
    } as never);
  });

  it("given repairOrderId, when rendered, then passes it to DeliveryNoteDetail", async () => {
    render(<DeliveryNoteTab repairOrderId={42} />);

    expect(await screen.findByTestId("deliveryNote-detail")).toBeInTheDocument();
    expect(screen.getByText("DeliveryNoteDetail for RO #42")).toBeInTheDocument();
  });

  it("given no delivery note and no estimates, when rendered, then shows the shared empty state with a title and an honest description", async () => {
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockRejectedValue(new Error("not found"));

    render(<DeliveryNoteTab repairOrderId={7} />);

    const emptyState = await screen.findByTestId("empty-state");
    expect(emptyState).toHaveTextContent("Todavía no hay remito para esta orden");
    expect(emptyState).toHaveTextContent(
      "Podés generar el remito de esta orden de trabajo desde esta solapa.",
    );
  });

  it("given no delivery note and no estimates, when rendered, then the empty state offers a deliberate action to generate the remito without an estimate", async () => {
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockRejectedValue(new Error("not found"));

    render(<DeliveryNoteTab repairOrderId={7} />);

    const emptyState = await screen.findByTestId("empty-state");
    expect(
      within(emptyState).getByRole("button", { name: "Generar remito sin presupuesto" }),
    ).toBeInTheDocument();
  });

  it("given the empty-state action, when the user confirms generating the remito without an estimate, then the create form is bound to the order's client and vehicle", async () => {
    const user = userEvent.setup();
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockRejectedValue(new Error("not found"));

    render(<DeliveryNoteTab repairOrderId={7} />);

    await user.click(await screen.findByRole("button", { name: "Generar remito sin presupuesto" }));

    // The confirmation must say explicitly that the order has no estimate.
    expect(await screen.findByText(/no tiene un presupuesto/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Generar remito" }));

    const detail = await screen.findByTestId("deliveryNote-detail");
    expect(detail).toHaveAttribute("data-repair-order-id", "7");
    expect(detail).toHaveAttribute("data-order-client-id", "3");
    expect(detail).toHaveAttribute("data-order-vehicle-id", "9");
  });

  it("given the order has no remito, when rendered, then the empty state offers an action to attach an existing remito", async () => {
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockRejectedValue(new Error("not found"));

    render(<DeliveryNoteTab repairOrderId={7} />);

    const emptyState = await screen.findByTestId("empty-state");
    expect(
      within(emptyState).getByRole("button", { name: "Asociar remito existente" }),
    ).toBeInTheDocument();
  });

  it("given the order already has a remito, when rendered, then no attach action is offered", async () => {
    render(<DeliveryNoteTab repairOrderId={7} />);

    await screen.findByTestId("deliveryNote-detail");
    expect(screen.queryByRole("button", { name: "Asociar remito existente" })).not.toBeInTheDocument();
  });

  it("given the attach action, when clicked, then opens the attach dialog scoped to the order's client and vehicle", async () => {
    const user = userEvent.setup();
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockRejectedValue(new Error("not found"));

    render(<DeliveryNoteTab repairOrderId={7} />);

    await user.click(await screen.findByRole("button", { name: "Asociar remito existente" }));

    const dialog = await screen.findByTestId("attach-delivery-note-dialog");
    expect(dialog).toHaveAttribute("data-repair-order-id", "7");
    expect(dialog).toHaveAttribute("data-client-id", "3");
    expect(dialog).toHaveAttribute("data-vehicle-id", "9");
  });
});
