import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { AppointmentCard } from "./AppointmentCard";

import type { AppointmentResponse } from "@/types/appointment";

const baseAppointment: AppointmentResponse = {
  id: 1,
  title: "Revisión general",
  clientId: 1,
  clientFullName: "Juan Perez",
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleBrand: "Toyota",
  vehicleModel: "Corolla",
  purpose: "Cambio de aceite",
  startTime: "2025-03-15T10:00:00",
  endTime: "2025-03-15T11:00:00",
  vehicleDeliveryMethod: null,
  vehicleArrivedAt: null,
  vehiclePickedUpAt: null,
  clientArrived: false,
  employees: [],
  tags: [{ id: 1, name: "Urgente", color: "#FF0000" }],
  createdAt: "2025-03-10T08:00:00",
  updatedAt: "2025-03-10T08:00:00",
};

const defaultProps = {
  appointment: baseAppointment,
  onClick: vi.fn(),
  onMarkClientArrived: vi.fn(),
  onMarkVehicleArrived: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("AppointmentCard", () => {
  it("given appointment, when rendered, then shows title and client name", () => {
    render(<AppointmentCard {...defaultProps} />);

    expect(screen.getByText("Revisión general")).toBeInTheDocument();
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
  });

  it("given appointment with plate, when rendered, then shows plate", () => {
    render(<AppointmentCard {...defaultProps} />);

    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("given client arrived, when rendered, then shows person icon indicator", () => {
    render(
      <AppointmentCard
        {...defaultProps}
        appointment={{ ...baseAppointment, clientArrived: true }}
      />,
    );

    expect(screen.getByTestId("PersonIcon")).toBeInTheDocument();
  });

  it("given appointment, when clicking card, then calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<AppointmentCard {...defaultProps} onClick={onClick} />);

    await user.click(screen.getByText("Revisión general"));

    expect(onClick).toHaveBeenCalledWith(baseAppointment);
  });

  it("given no title, when rendered, then shows fallback title", () => {
    render(
      <AppointmentCard
        {...defaultProps}
        appointment={{ ...baseAppointment, title: null }}
      />,
    );

    expect(screen.getByText("Cita #1")).toBeInTheDocument();
  });
});
