import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { AttachRepairOrderDialog } from "./AttachRepairOrderDialog";
import { repairOrdersApi } from "@/api/repairOrders";
import { estimatesApi } from "@/api/estimates";

import type { RepairOrderResponse } from "@/features/repair-orders/types";

vi.mock("@/api/repairOrders", () => ({
  repairOrdersApi: { search: vi.fn() },
}));

vi.mock("@/api/estimates", () => ({
  estimatesApi: { attachToRepairOrder: vi.fn() },
}));

function order(id: number, overrides: Partial<RepairOrderResponse> = {}): RepairOrderResponse {
  return {
    id,
    title: `Trabajo ${id}`,
    status: "REPARACION",
    clientId: 1,
    clientFirstName: "Juan",
    clientLastName: "Perez",
    clientPhone: "555-1234",
    vehicleId: 1,
    vehiclePlate: "AB123CD",
    vehicleBrandName: "Chevrolet",
    vehicleModel: "Corsa",
    vehicleYear: 2010,
    employees: [],
    tags: [],
    createdAt: "2025-03-01T10:00:00",
    updatedAt: "2025-03-01T10:00:00",
    ...overrides,
  };
}

function mockSearch(orders: RepairOrderResponse[]): void {
  vi.mocked(repairOrdersApi.search).mockResolvedValue({
    data: {
      data: {
        content: orders,
        totalElements: orders.length,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: orders.length === 0,
      },
    },
  } as never);
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

interface RenderDialogProps {
  estimateId?: number;
  clientId?: number;
  vehicleId?: number | null;
  onClose?: ReturnType<typeof vi.fn>;
  onAttached?: ReturnType<typeof vi.fn>;
}

function renderDialog(props: RenderDialogProps = {}) {
  return render(
    <AttachRepairOrderDialog
      open
      estimateId={props.estimateId ?? 3}
      clientId={props.clientId ?? 1}
      vehicleId={props.vehicleId === undefined ? 1 : props.vehicleId}
      onClose={props.onClose ?? vi.fn()}
      onAttached={props.onAttached ?? vi.fn()}
    />,
  );
}

describe("AttachRepairOrderDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch([]);
  });

  it("given candidate orders for the client and vehicle, when opened, then requests them filtered by client and vehicle and lists them", async () => {
    mockSearch([order(7), order(12)]);
    renderDialog();

    await waitFor(() => {
      expect(repairOrdersApi.search).toHaveBeenCalledWith({ clientId: 1, vehicleId: 1 });
    });
    expect(await screen.findByText(/Orden #7/)).toBeInTheDocument();
    expect(screen.getByText(/Orden #12/)).toBeInTheDocument();
  });

  it("given an estimate without a vehicle, when opened, then requests orders filtered only by the client", async () => {
    renderDialog({ vehicleId: null });

    await waitFor(() => {
      expect(repairOrdersApi.search).toHaveBeenCalledWith({ clientId: 1 });
    });
  });

  it("given no candidate orders for the client, when opened, then shows an honest empty state", async () => {
    renderDialog();

    expect(
      await screen.findByText("No hay órdenes de trabajo para este cliente."),
    ).toBeInTheDocument();
  });

  it("given a selected candidate order, when confirmed, then attaches the estimate to that order and reports success", async () => {
    const onAttached = vi.fn();
    vi.mocked(estimatesApi.attachToRepairOrder).mockResolvedValue({} as never);
    mockSearch([order(7)]);
    const user = userEvent.setup();
    renderDialog({ estimateId: 3, onAttached });

    await user.click(await screen.findByText(/Orden #7/));
    await user.click(screen.getByRole("button", { name: "Asociar" }));

    await waitFor(() => {
      expect(estimatesApi.attachToRepairOrder).toHaveBeenCalledWith(3, 7);
    });
    expect(onAttached).toHaveBeenCalled();
  });

  it("given the backend refuses the attachment, when confirmed, then shows the refusal message instead of swallowing it", async () => {
    const refusalMessage =
      "No se puede asociar el presupuesto porque la orden de trabajo ya está entregada.";
    vi.mocked(estimatesApi.attachToRepairOrder).mockRejectedValue(axiosRefusal(refusalMessage));
    mockSearch([order(7)]);
    const user = userEvent.setup();
    renderDialog();

    await user.click(await screen.findByText(/Orden #7/));
    await user.click(screen.getByRole("button", { name: "Asociar" }));

    expect(await screen.findByText(refusalMessage)).toBeInTheDocument();
  });
});
