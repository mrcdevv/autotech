import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { formatCurrency } from "@/utils/formatCurrency";

import ReportesPage from "./ReportesPage";

import type { DashboardReportsResponse } from "@/features/dashboard/types";

const REPORT: DashboardReportsResponse = {
  kpis: {
    totalBilled: 1000,
    totalCollected: 600,
    totalPending: 400,
    deliveryNoteCount: 4,
    pendingDeliveryNoteCount: 1,
    averageTicket: 250,
    estimatesTotal: 4,
    estimatesAccepted: 1,
    repairOrderCount: 5,
  },
  monthlyBilling: [{ year: 2026, month: 9, billed: 1000, collected: 600 }],
  services: [{ serviceName: "Frenos", count: 2, totalRevenue: 50000 }],
  brandCounts: [{ brandName: "Toyota", count: 1 }],
  debtAging: [
    { range: "0-30", deliveryNoteCount: 1, totalAmount: 400 },
    { range: "31-60", deliveryNoteCount: 0, totalAmount: 0 },
    { range: "61-90", deliveryNoteCount: 0, totalAmount: 0 },
    { range: "90+", deliveryNoteCount: 0, totalAmount: 0 },
  ],
  unpaidDeliveryNotes: [
    {
      deliveryNoteId: 7,
      clientFullName: "Carolina Mendez",
      vehiclePlate: "AB123CD",
      total: 400,
      createdAt: "2026-09-10T10:00:00",
    },
  ],
  mechanicProductivity: [{ employeeId: 5, employeeFullName: "Diego Soria", completedOrders: 3 }],
  averageRepairDays: 4.5,
};

const useReportsMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/dashboard/hooks/useReports", () => ({
  useReports: useReportsMock,
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

function renderPage() {
  return render(
    <MemoryRouter>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ReportesPage />
      </LocalizationProvider>
    </MemoryRouter>
  );
}

describe("ReportesPage", () => {
  beforeEach(() => {
    useReportsMock.mockReset();
    useReportsMock.mockImplementation((from: string) => ({
      data: from ? REPORT : null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    }));
  });

  it("given report data, when rendered, then shows the headline figures and every section", () => {
    renderPage();

    expect(screen.getByTestId("report-kpis").textContent).toContain(formatCurrency(1000));
    expect(screen.getByText("Facturado vs. cobrado por mes")).toBeInTheDocument();
    expect(screen.getByText("Antigüedad de la deuda")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Carolina Mendez" })).toHaveAttribute("href", "/remitos/7");
    expect(screen.getByText("Frenos")).toBeInTheDocument();
    expect(screen.getByText("Suspensión")).toBeInTheDocument();
    expect(screen.getByText("Diego Soria")).toBeInTheDocument();
    expect(screen.getByText("Solo se aprobó 1 de 4 presupuestos del período.")).toBeInTheDocument();
  });

  it("given page loaded, when rendered, then shows the period, brand and export controls", () => {
    renderPage();

    expect(screen.getByLabelText("Período")).toBeInTheDocument();
    expect(screen.getByLabelText("Marca")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exportar excel/i })).toBeInTheDocument();
  });

  it("given comparison is off, when toggled on, then requests the previous period too", async () => {
    const user = userEvent.setup();
    renderPage();
    const requestedPeriods = () => useReportsMock.mock.calls.map(([from]) => from).filter(Boolean);
    const before = new Set(requestedPeriods());

    await user.click(screen.getByLabelText("Comparar con período anterior"));

    expect(new Set(requestedPeriods()).size).toBe(before.size + 1);
  });
});
