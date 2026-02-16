import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";

import { VehicleForm } from "./VehicleForm";

import type { BrandResponse, VehicleTypeResponse } from "@/types/vehicle";

vi.mock("@/api/clientAutocomplete", () => ({
  clientAutocompleteApi: {
    search: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 1, firstName: "Juan", lastName: "Perez", dni: "12345678" },
          { id: 2, firstName: "Maria", lastName: "Garcia", dni: null },
        ],
      },
    }),
  },
}));

const mockBrands: BrandResponse[] = [
  { id: 1, name: "Toyota", createdAt: "" },
  { id: 2, name: "Ford", createdAt: "" },
];

const mockVehicleTypes: VehicleTypeResponse[] = [
  { id: 1, name: "AUTO" },
  { id: 2, name: "CAMIONETA" },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn().mockResolvedValue(undefined),
  onCreateBrand: vi.fn().mockResolvedValue({ id: 3, name: "New Brand", createdAt: "" }),
  initialData: null,
  brands: mockBrands,
  vehicleTypes: mockVehicleTypes,
};

describe("VehicleForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given create mode, when rendered, then shows all form fields", () => {
    render(
      <MemoryRouter>
        <VehicleForm {...defaultProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Nuevo vehículo")).toBeInTheDocument();
    expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/patente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/n° chasis/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/n° motor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/marca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/modelo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/año/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de vehículo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/observaciones/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });

  it("given edit mode, when rendered, then shows edit title", () => {
    const editData = {
      id: 1,
      clientId: 1,
      clientFirstName: "Juan",
      clientLastName: "Perez",
      clientDni: "12345678",
      plate: "ABC123",
      chassisNumber: null,
      engineNumber: null,
      brandId: 1,
      brandName: "Toyota",
      model: "Corolla",
      year: 2020,
      vehicleTypeId: 1,
      vehicleTypeName: "AUTO",
      observations: null,
      createdAt: "",
    };

    render(
      <MemoryRouter>
        <VehicleForm {...defaultProps} initialData={editData} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Editar vehículo")).toBeInTheDocument();
  });

  it("given cancel button, when clicked, then calls onClose", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <VehicleForm {...defaultProps} onClose={onClose} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
