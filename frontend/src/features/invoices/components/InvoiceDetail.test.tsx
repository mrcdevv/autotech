import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { InvoiceDetail } from "./InvoiceDetail";

import type { ClientAutocompleteResponse, VehicleResponse } from "@/types/vehicle";

const mockCreate = vi.fn();
const mockGetByRepairOrderId = vi.fn();
const mockGetById = vi.fn();
const mockDownloadPdf = vi.fn();
const mockGetInvoiceData = vi.fn();
const mockClientSearch = vi.fn();
const mockGetByClient = vi.fn();
const mockProductSearch = vi.fn();

vi.mock("@/api/invoices", () => ({
  invoicesApi: {
    create: (...args: unknown[]) => mockCreate(...args),
    getByRepairOrderId: (...args: unknown[]) => mockGetByRepairOrderId(...args),
    getById: (...args: unknown[]) => mockGetById(...args),
    downloadPdf: (...args: unknown[]) => mockDownloadPdf(...args),
  },
}));

vi.mock("@/api/estimates", () => ({
  estimatesApi: {
    getInvoiceData: (...args: unknown[]) => mockGetInvoiceData(...args),
  },
}));

vi.mock("@/api/clientAutocomplete", () => ({
  clientAutocompleteApi: {
    search: (...args: unknown[]) => mockClientSearch(...args),
  },
}));

vi.mock("@/api/vehicles", () => ({
  vehiclesApi: {
    getByClient: (...args: unknown[]) => mockGetByClient(...args),
  },
}));

vi.mock("@/api/products", () => ({
  productsApi: {
    search: (...args: unknown[]) => mockProductSearch(...args),
  },
}));

const orderClient: ClientAutocompleteResponse = {
  id: 1,
  firstName: "Juan",
  lastName: "Perez",
  dni: "12345678",
  phone: "1234567890",
  email: null,
  clientType: null,
};

const anotherClient: ClientAutocompleteResponse = {
  id: 999,
  firstName: "Otra",
  lastName: "Persona",
  dni: "87654321",
  phone: null,
  email: null,
  clientType: null,
};

const vehicle: VehicleResponse = {
  id: 5,
  clientId: 1,
  clientFirstName: "Juan",
  clientLastName: "Perez",
  clientDni: "12345678",
  plate: "ABC123",
  chassisNumber: null,
  engineNumber: null,
  brandId: null,
  brandName: "Toyota",
  model: "Corolla",
  year: 2020,
  vehicleTypeId: null,
  vehicleTypeName: null,
  observations: null,
  inRepair: false,
  createdAt: "2025-01-01T00:00:00",
};

// Props coming from the repair order detail (same prop set EstimateTab uses).
const orderProps = {
  repairOrderId: 42,
  orderClientId: 1,
  orderClientFirstName: "Juan",
  orderClientLastName: "Perez",
  orderClientDni: "12345678" as const,
  orderVehicleId: 5,
  orderVehiclePlate: "ABC123",
  orderVehicleBrandName: "Toyota" as const,
  orderVehicleModel: "Corolla",
  orderVehicleYear: 2020,
};

function renderInvoiceDetail(props: Parameters<typeof InvoiceDetail>[0]) {
  return render(
    <MemoryRouter>
      <InvoiceDetail {...props} />
    </MemoryRouter>,
  );
}

// Invoice creation validates that at least one service or product exists, so every
// submit-path test adds a minimal product row first.
async function addProductRow(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const productsSection = screen
    .getByText("Productos")
    .closest('[class*="MuiPaper-root"]') as HTMLElement;
  await user.click(within(productsSection).getByRole("button", { name: "Agregar" }));
  await user.type(within(productsSection).getByLabelText("Producto"), "Freno de disco");
}

beforeEach(() => {
  vi.clearAllMocks();
  const createdInvoice = {
    id: 100,
    clientId: 1,
    clientFullName: "Juan Perez",
    clientDni: "12345678",
    clientPhone: "",
    clientEmail: null,
    clientType: "REGISTERED",
    vehicleId: 5,
    vehiclePlate: "ABC123",
    vehicleBrand: "Toyota",
    vehicleModel: "Corolla",
    vehicleYear: 2020,
    repairOrderId: 42,
    estimateId: null,
    status: "PENDIENTE",
    discountPercentage: 0,
    taxPercentage: 0,
    total: null,
    services: [],
    products: [],
    createdAt: "2025-01-01T00:00:00",
    updatedAt: "2025-01-01T00:00:00",
  };
  mockCreate.mockResolvedValue({ data: { data: createdInvoice } });
  mockGetById.mockRejectedValue(new Error("not used"));
  mockGetByRepairOrderId.mockRejectedValue(new Error("no invoice yet"));
  mockClientSearch.mockResolvedValue({ data: { data: [orderClient, anotherClient] } });
  mockGetByClient.mockResolvedValue({ data: { data: [vehicle] } });
  mockProductSearch.mockResolvedValue({ data: { data: { content: [], totalElements: 0 } } });
});

describe("InvoiceDetail create-from-order", () => {
  it("given create-from-order with the OT's client and vehicle, when creating the invoice, then the payload carries the order's clientId and vehicleId", async () => {
    const user = userEvent.setup();
    renderInvoiceDetail(orderProps);

    const clientCombobox = await screen.findByRole("combobox", { name: "Cliente" });
    // Before the order prefill exists, the form forces the user to re-select a client
    // by hand (and the vehicle can never be chosen). Exercise that legacy path only
    // while the field is editable; once prefilled and locked the payload below must
    // hold without any user selection.
    if (!clientCombobox.hasAttribute("disabled")) {
      await user.click(clientCombobox);
      await user.click(await screen.findByText(/Otra Persona/));
    }

    await addProductRow(user);
    await user.click(screen.getByRole("button", { name: "Crear factura" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar" }));

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 1,
        vehicleId: 5,
        repairOrderId: 42,
      }),
    );
  });

  it("given create-from-order, when rendered, then the client and vehicle fields are locked", async () => {
    renderInvoiceDetail(orderProps);

    const clientCombobox = await screen.findByRole("combobox", { name: "Cliente" });
    const vehicleCombobox = screen.getByRole("combobox", { name: "Vehículo" });

    expect(clientCombobox).toBeDisabled();
    expect(vehicleCombobox).toBeDisabled();
  });

  it("given create-from-order, when rendered, then the client and vehicle fields show the OT's data instead of staying empty", async () => {
    renderInvoiceDetail(orderProps);

    const clientCombobox = await screen.findByRole("combobox", { name: "Cliente" });
    const vehicleCombobox = screen.getByRole("combobox", { name: "Vehículo" });

    await waitFor(() => expect(clientCombobox).toHaveValue("Juan Perez (12345678)"));
    expect(vehicleCombobox).toHaveValue("ABC123 - Corolla");
  });
});

describe("InvoiceDetail standalone creation", () => {
  it("given standalone creation, when the user picks a client and a vehicle, then both fields stay editable and the payload uses the picked ids", async () => {
    const user = userEvent.setup();
    renderInvoiceDetail({});

    const clientCombobox = await screen.findByRole("combobox", { name: "Cliente" });
    expect(clientCombobox).not.toBeDisabled();

    await user.click(clientCombobox);
    await user.click(await screen.findByText(/Otra Persona/));

    const vehicleCombobox = await screen.findByRole("combobox", { name: "Vehículo" });
    expect(vehicleCombobox).not.toBeDisabled();
    await user.click(vehicleCombobox);
    await user.click(await screen.findByText(/ABC123 - Corolla/));
    expect(vehicleCombobox).toHaveValue("ABC123 - Corolla");

    await addProductRow(user);
    await user.click(screen.getByRole("button", { name: "Crear factura" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar" }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 999,
        vehicleId: 5,
        repairOrderId: null,
      }),
    );
  });
});

describe("InvoiceDetail estimate-preloaded creation", () => {
  it("given an estimateId, when the estimate data is preloaded, then client and vehicle prefill from the estimate and stay editable", async () => {
    mockGetInvoiceData.mockResolvedValue({
      data: {
        data: {
          services: [{ serviceName: "Cambio de aceite", price: 500 }],
          products: [],
          discountPercentage: 0,
          taxPercentage: 0,
          clientId: 1,
          vehicleId: 5,
        },
      },
    });
    const user = userEvent.setup();
    renderInvoiceDetail({ estimateId: 7 });

    const clientCombobox = await screen.findByRole("combobox", { name: "Cliente" });
    const vehicleCombobox = screen.getByRole("combobox", { name: "Vehículo" });

    await waitFor(() => expect(clientCombobox).toHaveValue("Juan Perez (12345678)"));
    expect(vehicleCombobox).toHaveValue("ABC123 - Corolla");

    // The estimate path keeps both fields editable (unchanged behavior).
    expect(clientCombobox).not.toBeDisabled();
    expect(vehicleCombobox).not.toBeDisabled();

    // And the user can still change them freely.
    await user.click(clientCombobox);
    await user.click(await screen.findByText(/Otra Persona/));
    expect(clientCombobox).toHaveValue("Otra Persona (87654321)");
  });
});
