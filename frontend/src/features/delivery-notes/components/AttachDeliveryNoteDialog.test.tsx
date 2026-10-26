import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { AttachDeliveryNoteDialog } from "./AttachDeliveryNoteDialog";
import { deliveryNotesApi } from "@/api/deliveryNotes";

import type { DeliveryNoteResponse } from "@/types/deliveryNote";

vi.mock("@/api/deliveryNotes", () => ({
  deliveryNotesApi: { getAll: vi.fn(), attachToRepairOrder: vi.fn() },
}));

function deliveryNote(
  id: number,
  overrides: Partial<DeliveryNoteResponse> = {},
): DeliveryNoteResponse {
  return {
    id,
    number: 100 + id,
    clientId: 3,
    clientFullName: "Juan Perez",
    vehicleId: 9,
    vehiclePlate: "AB123CD",
    vehicleModel: "Corolla",
    repairOrderId: null,
    estimateId: null,
    status: "PENDIENTE",
    discountPercentage: 0,
    total: 1500,
    createdAt: "2025-03-01T10:00:00",
    updatedAt: "2025-03-01T10:00:00",
    ...overrides,
  };
}

function mockCandidates(notes: DeliveryNoteResponse[]): void {
  vi.mocked(deliveryNotesApi.getAll).mockResolvedValue({
    data: {
      data: {
        content: notes,
        totalElements: notes.length,
        totalPages: 1,
        size: 50,
        number: 0,
        first: true,
        last: true,
        empty: notes.length === 0,
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
  repairOrderId?: number;
  clientId?: number;
  vehicleId?: number | null;
  onClose?: ReturnType<typeof vi.fn>;
  onAttached?: ReturnType<typeof vi.fn>;
}

function renderDialog(props: RenderDialogProps = {}) {
  return render(
    <AttachDeliveryNoteDialog
      open
      repairOrderId={props.repairOrderId ?? 7}
      clientId={props.clientId ?? 3}
      vehicleId={props.vehicleId === undefined ? 9 : props.vehicleId}
      onClose={props.onClose ?? vi.fn()}
      onAttached={props.onAttached ?? vi.fn()}
    />,
  );
}

describe("AttachDeliveryNoteDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCandidates([]);
  });

  it("given the dialog opens for a repair order, when fetching candidates, then requests the client's remitos by clientId only, without a vehicleId filter", async () => {
    renderDialog({ clientId: 3 });

    await waitFor(() => {
      expect(deliveryNotesApi.getAll).toHaveBeenCalled();
    });
    // The vehicleId filter would silently drop remitos with no vehicle, so the
    // candidate request must carry the identity filter clientId and nothing else.
    const arg = vi.mocked(deliveryNotesApi.getAll).mock.calls[0]?.[0];
    expect(arg?.clientId).toBe(3);
    expect(arg?.vehicleId).toBeUndefined();
  });

  it("given candidates with a matching vehicle and with no vehicle, when opened, then lists both without dropping the null-vehicle remito", async () => {
    mockCandidates([
      deliveryNote(11, { vehicleId: 9, vehiclePlate: "AB123CD", vehicleModel: "Corolla" }),
      deliveryNote(12, { vehicleId: null, vehiclePlate: null, vehicleModel: null }),
    ]);
    renderDialog({ clientId: 3, vehicleId: 9 });

    expect(await screen.findByText(/Remito #111/)).toBeInTheDocument();
    expect(screen.getByText(/Remito #112/)).toBeInTheDocument();
    expect(screen.getByText(/Sin vehículo/)).toBeInTheDocument();
  });

  it("given a candidate remito for a different vehicle, when opened, then does not offer it", async () => {
    mockCandidates([deliveryNote(13, { vehicleId: 5, vehiclePlate: "ZZ999ZZ" })]);
    renderDialog({ clientId: 3, vehicleId: 9 });

    expect(await screen.findByText(/No hay remitos disponibles/i)).toBeInTheDocument();
    expect(screen.queryByText(/Remito #113/)).not.toBeInTheDocument();
  });

  it("given the client has no standalone remitos, when opened, then shows an honest empty message", async () => {
    renderDialog({ clientId: 3 });

    expect(
      await screen.findByText("No hay remitos disponibles para asociar a esta orden."),
    ).toBeInTheDocument();
  });

  it("given a selected remito, when the user confirms, then attaches it sending the deliveryNoteId and the repairOrderId", async () => {
    const onAttached = vi.fn();
    vi.mocked(deliveryNotesApi.attachToRepairOrder).mockResolvedValue({} as never);
    mockCandidates([deliveryNote(11)]);
    const user = userEvent.setup();
    renderDialog({ repairOrderId: 7, onAttached });

    await user.click(await screen.findByText(/Remito #111/));
    await user.click(screen.getByRole("button", { name: "Asociar" }));

    // Deliberate confirmation step before the API call.
    expect(await screen.findByText(/quedará asociado a esta orden/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Asociar remito" }));

    await waitFor(() => {
      expect(deliveryNotesApi.attachToRepairOrder).toHaveBeenCalledWith(11, 7);
    });
    expect(onAttached).toHaveBeenCalled();
  });

  it("given a selected remito that is already paid, when the confirmation is shown, then warns that the order will count as collected retroactively", async () => {
    mockCandidates([deliveryNote(11, { status: "PAGADA" })]);
    const user = userEvent.setup();
    renderDialog({ repairOrderId: 7 });

    await user.click(await screen.findByText(/Remito #111/));
    await user.click(screen.getByRole("button", { name: "Asociar" }));

    expect(await screen.findByText(/ya está pagado/i)).toBeInTheDocument();
    expect(screen.getByText(/esta orden se considera cobrada/i)).toBeInTheDocument();
  });

  it("given the backend refuses the attachment, when the user confirms, then shows the refusal message verbatim", async () => {
    const refusalMessage = "El remito ya está asociado a otra orden de trabajo.";
    vi.mocked(deliveryNotesApi.attachToRepairOrder).mockRejectedValue(axiosRefusal(refusalMessage));
    mockCandidates([deliveryNote(11)]);
    const user = userEvent.setup();
    renderDialog({ repairOrderId: 7 });

    await user.click(await screen.findByText(/Remito #111/));
    await user.click(screen.getByRole("button", { name: "Asociar" }));
    await user.click(await screen.findByRole("button", { name: "Asociar remito" }));

    expect(await screen.findByText(refusalMessage)).toBeInTheDocument();
  });
});
