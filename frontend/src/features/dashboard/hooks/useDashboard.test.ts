import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { useDashboard } from "./useDashboard";

vi.mock("@/api/dashboard", () => ({
  dashboardApi: {
    getSummary: vi.fn().mockResolvedValue({
      data: {
        data: {
          openRepairOrderCount: 5,
          todayAppointmentCount: 3,
          monthlyRevenue: 50000,
          averageTicket: 10000,
          repairOrderStatusCounts: [],
          todayAppointments: [],
          staleOrderAlerts: [],
          pendingEstimateAlerts: [],
          staleThresholdDays: 5,
        },
      },
    }),
  },
}));

describe("useDashboard", () => {
  it("given API returns data, when hook mounts, then returns summary", async () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary?.openRepairOrderCount).toBe(5);
    expect(result.current.error).toBeNull();
  });
});
