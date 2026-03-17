import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router";
import DashboardPage from "./DashboardPage";

vi.mock("@/features/dashboard/hooks/useDashboard", () => ({
  useDashboard: () => ({
    summary: {
      openRepairOrderCount: 5,
      readyForPickupCount: 2,
      todayAppointmentCount: 3,
      pendingEstimateCount: 4,
      repairOrderStatusCounts: [{ status: "REPARACION", count: 3 }],
      todayAppointments: [],
      readyForPickupOrders: [],
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
    expect(screen.getByText("Vehículos en taller")).toBeInTheDocument();
    const kpiValues = screen.getAllByTestId("kpi-value");
    expect(kpiValues).toHaveLength(4);
    expect(kpiValues[0]).toHaveTextContent("5");
    expect(kpiValues[1]).toHaveTextContent("2");
    expect(kpiValues[2]).toHaveTextContent("3");
    expect(kpiValues[3]).toHaveTextContent("4");
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
  });
});
