import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import ReportesPage from "./ReportesPage";

vi.mock("@/features/dashboard/hooks/useReports", () => ({
  useReports: () => ({
    data: {
      monthlyBilling: [{ year: 2026, month: 9, total: 100000 }],
      topServices: [{ serviceName: "Frenos", count: 2 }],
      serviceRevenue: [{ serviceName: "Frenos", totalRevenue: 50000 }],
      brandCounts: [{ brandName: "Toyota", count: 1 }],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/dashboard/hooks/useFaults", () => ({
  useFaults: () => ({
    data: [{ faultName: "Suspensión", count: 1 }],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/vehicles/hooks/useBrands", () => ({
  useBrands: () => ({
    brands: [{ id: 8, name: "Toyota", createdAt: "2026-01-01T00:00:00" }],
    loading: false,
    createBrand: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/dashboard/components/MonthlyBillingChart", () => ({
  MonthlyBillingChart: () => <div data-testid="monthly-billing-chart" />,
}));

vi.mock("@/features/dashboard/components/ServiceRevenueChart", () => ({
  ServiceRevenueChart: () => <div data-testid="service-revenue-chart" />,
}));

vi.mock("@/features/dashboard/components/BrandsChart", () => ({
  BrandsChart: () => <div data-testid="brands-chart" />,
}));

describe("ReportesPage", () => {
  it("given page loaded, when rendered, then shows the five report cards", () => {
    render(<ReportesPage />);

    expect(screen.getByText("Facturación por mes")).toBeInTheDocument();
    expect(screen.getByText("Servicios más realizados")).toBeInTheDocument();
    expect(screen.getByText("Ingresos generados por servicio")).toBeInTheDocument();
    expect(screen.getByText("Marcas de vehículos más atendidas")).toBeInTheDocument();
    expect(screen.getByText("Averías más frecuentes")).toBeInTheDocument();

    expect(screen.getByTestId("monthly-billing-chart")).toBeInTheDocument();
    expect(screen.getByTestId("service-revenue-chart")).toBeInTheDocument();
    expect(screen.getByTestId("brands-chart")).toBeInTheDocument();
    expect(screen.getByText("Frenos")).toBeInTheDocument();
    expect(screen.getByText("Suspensión")).toBeInTheDocument();
  });

  it("given page loaded, when rendered, then shows the period and brand filters", () => {
    render(<ReportesPage />);

    expect(screen.getByLabelText("Período")).toBeInTheDocument();
    expect(screen.getByLabelText("Marca")).toBeInTheDocument();
  });
});
