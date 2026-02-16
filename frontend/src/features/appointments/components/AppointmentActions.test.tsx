import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { AppointmentActions } from "./AppointmentActions";

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
  onMarkClientArrived: vi.fn(),
  onMarkVehicleArrived: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("AppointmentActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given actions button, when clicked, then opens menu", async () => {
    const user = userEvent.setup();
    render(<AppointmentActions {...defaultProps} />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Marcar cliente presente")).toBeInTheDocument();
    expect(screen.getByText("Marcar vehículo recibido")).toBeInTheDocument();
    expect(screen.getByText("Editar fecha y hora")).toBeInTheDocument();
    expect(screen.getByText("Eliminar cita")).toBeInTheDocument();
  });

  it("given client not arrived, when clicking mark arrived, then calls handler", async () => {
    const user = userEvent.setup();
    const onMarkClientArrived = vi.fn();
    render(<AppointmentActions {...defaultProps} onMarkClientArrived={onMarkClientArrived} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Marcar cliente presente"));

    expect(onMarkClientArrived).toHaveBeenCalledWith(1, true);
  });

  it("given client arrived, when clicking unmark, then calls handler with false", async () => {
    const user = userEvent.setup();
    const onMarkClientArrived = vi.fn();
    render(
      <AppointmentActions
        {...defaultProps}
        appointment={{ ...baseAppointment, clientArrived: true }}
        onMarkClientArrived={onMarkClientArrived}
      />,
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Desmarcar cliente presente"));

    expect(onMarkClientArrived).toHaveBeenCalledWith(1, false);
  });

  it("given vehicle already arrived, when opened, then hides vehicle arrived option", async () => {
    const user = userEvent.setup();
    render(
      <AppointmentActions
        {...defaultProps}
        appointment={{ ...baseAppointment, vehicleArrivedAt: "2025-03-15T10:30:00" }}
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.queryByText("Marcar vehículo recibido")).not.toBeInTheDocument();
  });

  it("given edit option, when clicked, then calls onEdit", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<AppointmentActions {...defaultProps} onEdit={onEdit} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Editar fecha y hora"));

    expect(onEdit).toHaveBeenCalledWith(baseAppointment);
  });

  it("given delete option, when clicked, then calls onDelete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<AppointmentActions {...defaultProps} onDelete={onDelete} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Eliminar cita"));

    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
