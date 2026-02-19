import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import DashboardPage from "./DashboardPage";

const mockSummary = {
  openRepairOrderCount: 5,
  todayAppointmentCount: 3,
  monthlyRevenue: 50000,
  averageTicket: 10000,
  repairOrderStatusCounts: [{ status: "REPARACION", count: 3 }],
  todayAppointments: [],
  staleOrderAlerts: [],
  pendingEstimateAlerts: [],
  staleThresholdDays: 5,
};

vi.mock("@/features/dashboard/hooks/useDashboard", () => ({
  useDashboard: () => ({
    summary: mockSummary,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/dashboard/components/FinancieroTab", () => ({
  FinancieroTab: () => <div data-testid="financiero-tab">FinancieroTab</div>,
}));

vi.mock("@/features/dashboard/components/ProductividadTab", () => ({
  ProductividadTab: () => <div data-testid="productividad-tab">ProductividadTab</div>,
}));

describe("DashboardPage", () => {
  it("given summary loaded, when rendered, then shows KPI cards", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Órdenes abiertas")).toBeInTheDocument();
    expect(screen.getAllByText("Citas de hoy")).toHaveLength(2);
    expect(screen.getByText("Facturación del mes")).toBeInTheDocument();
    expect(screen.getByText("Ticket promedio")).toBeInTheDocument();
  });

  it("given summary loaded, when rendered, then shows Financiero tab by default", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("financiero-tab")).toBeInTheDocument();
  });

  it("given summary loaded, when clicking Productividad tab, then shows productividad content", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByRole("tab", { name: "Productividad" }));

    expect(screen.getByTestId("productividad-tab")).toBeInTheDocument();
  });

  it("given summary loaded, when rendered, then shows status breakdown", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Estado de órdenes")).toBeInTheDocument();
  });
});
