import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { AppointmentActionsMenu } from "./AppointmentActions";

import type { AppointmentResponse } from "@/types/appointment";

const baseAppointment: AppointmentResponse = {
  id: 1,
  title: "Test",
  clientId: null,
  clientFullName: null,
  vehicleId: null,
  vehiclePlate: null,
  vehicleBrand: null,
  vehicleModel: null,
  purpose: null,
  startTime: "2025-03-15T10:00:00",
  endTime: "2025-03-15T11:00:00",
  vehicleDeliveryMethod: null,
  status: "SCHEDULED",
  vehicleArrivedAt: null,
  vehiclePickedUpAt: null,
  clientArrived: false,
  employees: [],
  tags: [],
  createdAt: "",
  updatedAt: "",
};

const defaultProps = {
  appointment: baseAppointment,
  anchorEl: document.createElement("button"),
  onClose: vi.fn(),
  onMarkVehicleArrived: vi.fn(),
  onEdit: vi.fn(),
  onCancel: vi.fn(),
  onDelete: vi.fn(),
  onCreateWorkOrder: vi.fn(),
};

describe("AppointmentActionsMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given menu open, when rendered, then shows all options", () => {
    render(<AppointmentActionsMenu {...defaultProps} />);

    expect(screen.getByText("Marcar vehículo recibido")).toBeInTheDocument();
    expect(screen.getByText("Editar fecha y hora")).toBeInTheDocument();
    expect(screen.getByText("Crear orden de trabajo")).toBeInTheDocument();
    expect(screen.getByText("Cancelar cita")).toBeInTheDocument();
    expect(screen.getByText("Eliminar cita")).toBeInTheDocument();
  });

  it("given vehicle already arrived, when opened, then hides vehicle arrived option", () => {
    render(
      <AppointmentActionsMenu
        {...defaultProps}
        appointment={{ ...baseAppointment, vehicleArrivedAt: "2025-03-15T10:30:00" }}
      />,
    );

    expect(screen.queryByText("Marcar vehículo recibido")).not.toBeInTheDocument();
  });

  it("given edit option, when clicked, then calls onEdit", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<AppointmentActionsMenu {...defaultProps} onEdit={onEdit} />);

    await user.click(screen.getByText("Editar fecha y hora"));

    expect(onEdit).toHaveBeenCalledWith(baseAppointment);
  });

  it("given delete option, when clicked, then calls onDelete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<AppointmentActionsMenu {...defaultProps} onDelete={onDelete} />);

    await user.click(screen.getByText("Eliminar cita"));

    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("given cancelled appointment, when opened, then hides cancel and create order options", () => {
    render(
      <AppointmentActionsMenu
        {...defaultProps}
        appointment={{ ...baseAppointment, status: "CANCELLED" }}
      />,
    );

    expect(screen.queryByText("Cancelar cita")).not.toBeInTheDocument();
    expect(screen.queryByText("Crear orden de trabajo")).not.toBeInTheDocument();
  });
});
