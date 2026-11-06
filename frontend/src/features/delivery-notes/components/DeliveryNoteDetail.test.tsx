import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { DeliveryNoteDetail } from "./DeliveryNoteDetail";
import { deliveryNotesApi } from "@/api/deliveryNotes";

vi.mock("@/api/deliveryNotes", () => ({
  deliveryNotesApi: {
    getById: vi.fn(),
    getByRepairOrderId: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/api/taxConfig", () => ({
  taxConfigApi: {
    getConfig: vi.fn().mockResolvedValue({ data: { data: { taxPercentage: 21 } } }),
  },
}));

vi.mock("@/api/clientAutocomplete", () => ({
  clientAutocompleteApi: { search: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}));

vi.mock("@/api/vehicles", () => ({
  vehiclesApi: { getByClient: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}));

vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => false }),
}));

function renderFromOrder() {
  return render(
    <MemoryRouter initialEntries={["/ordenes/7"]}>
      <DeliveryNoteDetail
        repairOrderId={7}
        orderClientId={3}
        orderClientFirstName="Juan"
        orderClientLastName="Perez"
        orderClientDni="30123456"
        orderVehicleId={9}
        orderVehiclePlate="AB123CD"
        orderVehicleBrandName="Toyota"
        orderVehicleModel="Corolla"
        orderVehicleYear={2015}
      />
    </MemoryRouter>,
  );
}

describe("DeliveryNoteDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockRejectedValue(new Error("not found"));
  });

  it("given create-from-order mode, when rendered, then the client and vehicle fields are prefilled from the order and locked", async () => {
    renderFromOrder();

    const clientInput = await screen.findByLabelText("Cliente");
    expect(clientInput).toBeDisabled();
    expect(clientInput).toHaveValue("Juan Perez (30123456)");

    const vehicleInput = screen.getByLabelText("Vehículo");
    expect(vehicleInput).toBeDisabled();
    expect(vehicleInput).toHaveValue("AB123CD - Corolla");
  });

  it("given standalone create mode (no order props), when rendered, then the client field stays editable", async () => {
    render(
      <MemoryRouter initialEntries={["/remitos/nuevo"]}>
        <DeliveryNoteDetail />
      </MemoryRouter>,
    );

    const clientInput = await screen.findByLabelText("Cliente");
    expect(clientInput).toBeEnabled();
  });

  it("given create-from-order mode, when the user creates the remito, then the API receives the order's client and vehicle and no estimate", async () => {
    const user = userEvent.setup();
    vi.mocked(deliveryNotesApi.create).mockResolvedValue({
      data: {
        data: {
          id: 50,
          number: 50,
          clientId: 3,
          clientFullName: "Juan Perez",
          clientDni: "30123456",
          clientPhone: "",
          clientEmail: null,
          clientType: "REGISTRADO",
          vehicleId: 9,
          vehiclePlate: "AB123CD",
          vehicleBrand: "Toyota",
          vehicleModel: "Corolla",
          vehicleYear: 2015,
          repairOrderId: 7,
          estimateId: null,
          status: "PENDIENTE",
          discountPercentage: 0,
          taxPercentage: 21,
          total: 0,
          services: [],
          products: [],
          createdAt: "2026-01-01T00:00:00",
          updatedAt: "2026-01-01T00:00:00",
        },
      },
    } as never);
    renderFromOrder();

    // Add one product line so form validation passes.
    const addButtons = screen.getAllByText("Agregar");
    await user.click(addButtons[addButtons.length - 1]!);
    await user.type(screen.getByLabelText("Producto"), "Filtro de aceite");

    await user.click(screen.getByRole("button", { name: "Crear remito" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(deliveryNotesApi.create).toHaveBeenCalledTimes(1);
    });
    expect(deliveryNotesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 3,
        vehicleId: 9,
        repairOrderId: 7,
        estimateId: null,
      }),
    );
  });
});
