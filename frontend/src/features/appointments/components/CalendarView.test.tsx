import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { CalendarView } from "./CalendarView";

import type { AppointmentResponse } from "@/types/appointment";

const mockAppointment: AppointmentResponse = {
  id: 1,
  title: "Test Appointment",
  clientId: 1,
  clientFullName: "Juan Perez",
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
  appointments: [mockAppointment],
  currentDate: new Date(2025, 2, 15),
  loading: false,
  businessStartHour: 8,
  businessEndHour: 20,
  onAppointmentClick: vi.fn(),
  onMarkClientArrived: vi.fn(),
  onMarkVehicleArrived: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("CalendarView", () => {
  it("given loading, when rendered, then shows spinner", () => {
    render(<CalendarView {...defaultProps} loading={true} viewMode="week" />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("given day view, when rendered, then shows time slots", () => {
    render(<CalendarView {...defaultProps} viewMode="day" />);

    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("given week view with appointment, when rendered, then shows appointment card", () => {
    render(<CalendarView {...defaultProps} viewMode="week" />);

    expect(screen.getByText("Test Appointment")).toBeInTheDocument();
  });

  it("given month view, when rendered, then shows day numbers and headers", () => {
    render(<CalendarView {...defaultProps} viewMode="month" />);

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Lun")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 11:00")).toBeInTheDocument();
  });

  it("given day view with appointment, when rendered, then shows appointment card", () => {
    render(<CalendarView {...defaultProps} viewMode="day" />);

    expect(screen.getByText("Test Appointment")).toBeInTheDocument();
  });
});
