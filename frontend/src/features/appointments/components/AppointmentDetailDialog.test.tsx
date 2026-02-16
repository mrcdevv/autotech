import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { AppointmentDetailDialog } from "./AppointmentDetailDialog";

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
  vehicleDeliveryMethod: "PROPIO",
  vehicleArrivedAt: "2025-03-15T10:15:00",
  vehiclePickedUpAt: null,
  clientArrived: true,
  employees: [{ id: 1, firstName: "Carlos", lastName: "Lopez" }],
  tags: [{ id: 1, name: "Urgente", color: "#FF0000" }],
  createdAt: "",
  updatedAt: "",
};

describe("AppointmentDetailDialog", () => {
  it("given appointment, when rendered, then shows all fields", () => {
    render(
      <AppointmentDetailDialog open={true} appointment={baseAppointment} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Revisión general")).toBeInTheDocument();
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText(/ABC123/)).toBeInTheDocument();
    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
    expect(screen.getByText("Carlos Lopez")).toBeInTheDocument();
    expect(screen.getByText("Propio")).toBeInTheDocument();
  });

  it("given null vehicle picked up, when rendered, then shows Pendiente", () => {
    render(
      <AppointmentDetailDialog open={true} appointment={baseAppointment} onClose={vi.fn()} />,
    );

    const pendienteElements = screen.getAllByText("Pendiente");
    expect(pendienteElements.length).toBeGreaterThan(0);
  });

  it("given client arrived true, when rendered, then shows Sí", () => {
    render(
      <AppointmentDetailDialog open={true} appointment={baseAppointment} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Sí")).toBeInTheDocument();
  });

  it("given client arrived false, when rendered, then shows No", () => {
    render(
      <AppointmentDetailDialog
        open={true}
        appointment={{ ...baseAppointment, clientArrived: false }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("given null appointment, when rendered, then renders nothing", () => {
    const { container } = render(
      <AppointmentDetailDialog open={true} appointment={null} onClose={vi.fn()} />,
    );

    expect(container.innerHTML).toBe("");
  });
});
