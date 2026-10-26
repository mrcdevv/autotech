import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { EditRepairOrderDialog } from "./EditRepairOrderDialog";
import { repairOrdersApi } from "@/api/repairOrders";

import type { RepairOrderDetailResponse } from "../types";

vi.mock("@/api/repairOrders", () => ({
  repairOrdersApi: {
    update: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

vi.mock("@/api/tags", () => ({
  tagsApi: {
    getAll: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 1, name: "Mantenimiento", color: null },
          { id: 2, name: "Urgente", color: "#f44336" },
        ],
      },
    }),
  },
}));

const sampleOrder: RepairOrderDetailResponse = {
  id: 1,
  title: "OT-1 Perez - ABC123",
  status: "INGRESO_VEHICULO",
  reason: "Ruido en el motor",
  clientSource: "Recomendación",
  mechanicNotes: "Revisar capa de rodadura",
  appointmentId: 7,
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
  employees: [
    { id: 3, firstName: "Carlos", lastName: "Lopez" },
    { id: 5, firstName: "Maria", lastName: "Gomez" },
  ],
  tags: [],
  workHistory: [],
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

describe("EditRepairOrderDialog", () => {
  it("given open dialog, then fields are pre-filled from the loaded order", async () => {
    render(<EditRepairOrderDialog open order={sampleOrder} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(await screen.findByLabelText("Etiquetas")).toBeInTheDocument();
    expect(screen.getByLabelText("Motivo de ingreso")).toHaveValue("Ruido en el motor");
    expect(screen.getByLabelText("Notas del mecánico")).toHaveValue("Revisar capa de rodadura");
    expect(screen.getByLabelText("Origen del cliente")).toHaveValue("Recomendación");
  });

  it("given open dialog, then client and vehicle are shown read-only and not editable", async () => {
    render(<EditRepairOrderDialog open order={sampleOrder} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("Toyota Corolla 2020 · ABC123")).toBeInTheDocument();
    // Exact names: /cliente/i would also match the required "Origen del cliente"
    // edit field below; the intent is that no client/vehicle field is editable.
    expect(screen.queryByRole("textbox", { name: "Cliente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Vehículo" })).not.toBeInTheDocument();
  });

  it("given edited fields, when saved, then sends the round-trip payload preserving appointment and employees", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(<EditRepairOrderDialog open order={sampleOrder} onClose={onClose} onSuccess={onSuccess} />);

    const reason = await screen.findByLabelText("Motivo de ingreso");
    await user.clear(reason);
    await user.type(reason, "Frenos revisados");

    await user.click(screen.getByLabelText("Etiquetas"));
    await user.click(await screen.findByRole("option", { name: "Urgente" }));

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(repairOrdersApi.update).toHaveBeenCalledWith(1, {
      clientId: 1,
      vehicleId: 1,
      appointmentId: 7,
      reason: "Frenos revisados",
      mechanicNotes: "Revisar capa de rodadura",
      clientSource: "Recomendación",
      employeeIds: [3, 5],
      tagIds: [2],
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("given API error, when saved, then shows an error message and keeps the dialog open", async () => {
    vi.mocked(repairOrdersApi.update).mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditRepairOrderDialog open order={sampleOrder} onClose={onClose} onSuccess={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Error al guardar los cambios")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
