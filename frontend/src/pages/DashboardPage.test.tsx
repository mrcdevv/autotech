import { render, screen, within } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router";
import DashboardPage from "./DashboardPage";

vi.mock("@/features/dashboard/hooks/useHomeDashboard", () => ({
  useHomeDashboard: () => ({
    summary: {
      openRepairOrderCount: 5,
      readyForPickupCount: 1,
      todayAppointmentCount: 2,
      pendingEstimateCount: 2,
      repairOrderStatusCounts: [{ status: "REPARACION", count: 3 }],
      todayAppointments: [],
      readyForPickupOrders: [
        {
          repairOrderId: 4,
          title: "Embrague completo",
          clientFullName: "Logística Norte",
          clientPhone: "351 701 0004",
          vehiclePlate: "AE321IJ",
        },
      ],
      staleOrderAlerts: [
        {
          repairOrderId: 9,
          title: "Frenos delanteros",
          clientFullName: "Ana Gómez",
          vehiclePlate: "AA111AA",
          status: "REPARACION",
          daysSinceLastUpdate: 7,
        },
      ],
      pendingEstimateAlerts: [
        {
          estimateId: 1,
          clientFullName: "Juan Pérez",
          vehiclePlate: "BB222BB",
          total: 202851,
          daysPending: 6,
        },
      ],
      staleThresholdDays: 5,
    },
    orders: [
      {
        id: 1,
        title: "Frenos delanteros",
        status: "REPARACION",
        clientId: 1,
        clientFirstName: "Carolina",
        clientLastName: "Mendez",
        clientPhone: "351 701 0001",
        vehicleId: 1,
        vehiclePlate: "AB123CD",
        vehicleBrandName: "Toyota",
        vehicleModel: "Corolla",
        vehicleYear: 2021,
        employees: [{ id: 1, firstName: "Marcela", lastName: "Rivas" }],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    appointments: [
      {
        id: 1,
        title: null,
        clientId: 1,
        clientFullName: "Javier Quiroga",
        vehicleId: 1,
        vehiclePlate: "AC456EF",
        vehicleBrand: "Ford",
        vehicleModel: "Ranger",
        purpose: "Tren delantero",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        vehicleDeliveryMethod: null,
        status: "SCHEDULED",
        vehicleArrivedAt: null,
        vehiclePickedUpAt: null,
        clientArrived: false,
        employees: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    invoices: [
      {
        id: 1,
        clientId: 1,
        clientFullName: "Carolina Mendez",
        vehicleId: null,
        vehiclePlate: null,
        vehicleModel: null,
        repairOrderId: null,
        estimateId: null,
        status: "PAGADA",
        discountPercentage: 0,
        taxPercentage: 0,
        total: 122815,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe("DashboardPage", () => {
  it("given data loaded, when rendered, then shows the workshop carousel for the open order", () => {
    renderWithRouter();

    const carousel = within(screen.getByTestId("workshop-carousel"));
    expect(carousel.getByText("Taller")).toBeInTheDocument();
    expect(carousel.getByText("1 vehículo en taller")).toBeInTheDocument();
    expect(carousel.getByText("Toyota Corolla 2021")).toBeInTheDocument();
    expect(carousel.getByText("AB123CD")).toBeInTheDocument();
    expect(carousel.getByText("Puesto 1")).toBeInTheDocument();
    expect(carousel.getByText("Frenos delanteros")).toBeInTheDocument();
  });

  it("given data loaded, when rendered, then shows the work queue with the repair order", () => {
    renderWithRouter();

    const queue = within(screen.getByTestId("work-queue"));
    expect(queue.getByText("Cola de trabajo")).toBeInTheDocument();
    expect(queue.getByText("OT-1")).toBeInTheDocument();
  });

  it("given data loaded, when rendered, then shows upcoming appointments and daily cash", () => {
    renderWithRouter();

    expect(screen.getByText("Próximas citas")).toBeInTheDocument();
    expect(screen.getByText("Caja del día")).toBeInTheDocument();
  });

  it("given alerts, when rendered, then shows both alert panels", () => {
    renderWithRouter();

    expect(screen.getByText(/Órdenes inactivas/)).toBeInTheDocument();
    expect(screen.getByText(/Presupuestos pendientes/)).toBeInTheDocument();
  });
});
