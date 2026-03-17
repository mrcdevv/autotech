import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { useFinanciero } from "./useFinanciero";

vi.mock("@/api/dashboard", () => ({
  dashboardApi: {
    getFinanciero: vi.fn().mockResolvedValue({
      data: {
        data: {
          monthlyRevenue: [],
          estimateConversionRate: 80,
          estimatesAccepted: 8,
          estimatesTotal: 10,
          totalPendingBilling: 15000,
          debtAging: [],
          topUnpaidInvoices: [],
        },
      },
    }),
    exportFinanciero: vi.fn().mockResolvedValue({
      data: new Blob(),
    }),
  },
}));

describe("useFinanciero", () => {
  it("given API returns data, when hook mounts, then returns financiero data", async () => {
    const { result } = renderHook(() => useFinanciero(6));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.estimateConversionRate).toBe(80);
    expect(result.current.error).toBeNull();
  });

  it("given hook mounted, when exportToExcel is defined, then it is a function", async () => {
    const { result } = renderHook(() => useFinanciero(6));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.exportToExcel).toBe("function");
  });
});
