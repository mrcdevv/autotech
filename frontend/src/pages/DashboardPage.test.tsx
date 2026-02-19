import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router";
import DashboardPage from "./DashboardPage";

vi.mock("@/features/dashboard/hooks/useDashboard", () => ({
  useDashboard: () => ({
    summary: {
      openRepairOrderCount: 5,
      todayAppointmentCount: 3,
      monthlyRevenue: 50000,
      averageTicket: 10000,
      repairOrderStatusCounts: [{ status: "REPARACION", count: 3 }],
      todayAppointments: [],
      staleOrderAlerts: [],
      pendingEstimateAlerts: [],
      staleThresholdDays: 5,
    },
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
  it("given summary loaded, when rendered, then shows KPI cards", () => {
    renderWithRouter();

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Órdenes abiertas")).toBeInTheDocument();
    expect(screen.getByText("Facturación del mes")).toBeInTheDocument();
    expect(screen.getByText("Ticket promedio")).toBeInTheDocument();
  });

  it("given summary loaded, when rendered, then shows status breakdown", () => {
    renderWithRouter();

    expect(screen.getByText("Estado de órdenes")).toBeInTheDocument();
  });

  it("given summary loaded, when rendered, then shows Ver reportes button", () => {
    renderWithRouter();

    expect(screen.getByText("Ver reportes")).toBeInTheDocument();
  });

  it("given summary loaded, when rendered, then shows alerts sections", () => {
    renderWithRouter();

    expect(screen.getByText(/Órdenes inactivas/)).toBeInTheDocument();
    expect(screen.getByText(/Presupuestos pendientes/)).toBeInTheDocument();
  });
});
