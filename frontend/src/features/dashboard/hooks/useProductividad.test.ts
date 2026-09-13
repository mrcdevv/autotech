import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { useProductividad } from "./useProductividad";

vi.mock("@/api/dashboard", () => ({
  dashboardApi: {
    getProductividad: vi.fn().mockResolvedValue({
      data: {
        data: {
          averageRepairDays: 3.5,
          mechanicProductivity: [],
          topServices: [],
        },
      },
    }),
    exportProductividad: vi.fn().mockResolvedValue({
      data: new Blob(),
    }),
  },
}));

describe("useProductividad", () => {
  it("given API returns data, when hook mounts, then returns productividad data", async () => {
    const { result } = renderHook(() => useProductividad());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.averageRepairDays).toBe(3.5);
    expect(result.current.error).toBeNull();
  });

  it("given hook mounted, when exportToExcel is defined, then it is a function", async () => {
    const { result } = renderHook(() => useProductividad());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.exportToExcel).toBe("function");
  });
});
