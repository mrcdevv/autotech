import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { FinancieroTab } from "./FinancieroTab";

vi.mock("@/features/dashboard/hooks/useFinanciero", () => ({
  useFinanciero: () => ({
    data: {
      monthlyRevenue: [{ year: 2026, month: 1, total: 50000 }],
      estimateConversionRate: 80,
      estimatesAccepted: 8,
      estimatesTotal: 10,
      totalPendingBilling: 15000,
      debtAging: [
        { range: "0-30", deliveryNoteCount: 2, totalAmount: 5000 },
        { range: "31-60", deliveryNoteCount: 1, totalAmount: 3000 },
        { range: "61-90", deliveryNoteCount: 0, totalAmount: 0 },
        { range: "90+", deliveryNoteCount: 0, totalAmount: 0 },
      ],
      topUnpaidDeliveryNotes: [],
    },
    loading: false,
    error: null,
    exportToExcel: vi.fn(),
  }),
}));

vi.mock("@mui/x-charts/BarChart", () => ({
  BarChart: () => <div data-testid="bar-chart">BarChart</div>,
}));

describe("FinancieroTab", () => {
  it("given data loaded, when rendered, then shows conversion rate and export button", () => {
    render(<FinancieroTab />);

    expect(screen.getByText("80.0%")).toBeInTheDocument();
    expect(screen.getByText("Exportar a Excel")).toBeInTheDocument();
    expect(screen.getByText("Antigüedad de deuda")).toBeInTheDocument();
  });

  it("given data loaded, when rendered, then shows debt aging table", () => {
    render(<FinancieroTab />);

    expect(screen.getByText("0-30")).toBeInTheDocument();
    expect(screen.getByText("31-60")).toBeInTheDocument();
  });
});
