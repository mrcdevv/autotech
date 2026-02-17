import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TodayAppointmentsList } from "./TodayAppointmentsList";

describe("TodayAppointmentsList", () => {
  it("given appointments, when rendered, then shows client names", () => {
    const appointments = [
      {
        appointmentId: 1,
        startTime: "2026-02-19T10:00:00",
        clientFullName: "Juan Perez",
        vehiclePlate: "ABC123",
        purpose: "Service",
      },
    ];

    render(<TodayAppointmentsList appointments={appointments} />);

    expect(screen.getByText(/Juan Perez/)).toBeInTheDocument();
    expect(screen.getByText(/ABC123/)).toBeInTheDocument();
  });

  it("given no appointments, when rendered, then shows empty state", () => {
    render(<TodayAppointmentsList appointments={[]} />);

    expect(screen.getByText("No hay citas para hoy")).toBeInTheDocument();
  });

  it("given appointment without client, when rendered, then shows fallback text", () => {
    const appointments = [
      {
        appointmentId: 2,
        startTime: "2026-02-19T14:00:00",
        clientFullName: null,
        vehiclePlate: null,
        purpose: null,
      },
    ];

    render(<TodayAppointmentsList appointments={appointments} />);

    expect(screen.getByText(/Sin cliente/)).toBeInTheDocument();
  });
});
