import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useReports } from "./useReports";

import type { DashboardReportsResponse } from "@/features/dashboard/types";

const mockGetReports = vi.fn();

vi.mock("@/api/dashboard", () => ({
  dashboardApi: {
    getReports: (...args: unknown[]) => mockGetReports(...args),
  },
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeResponse(payload: DashboardReportsResponse) {
  return { data: { data: payload } };
}

const OLDER: DashboardReportsResponse = {
  monthlyBilling: [{ year: 2025, month: 1, total: 100 }],
  topServices: [],
  serviceRevenue: [],
  brandCounts: [],
};

const NEWER: DashboardReportsResponse = {
  monthlyBilling: [{ year: 2025, month: 2, total: 200 }],
  topServices: [],
  serviceRevenue: [],
  brandCounts: [],
};

describe("useReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given two overlapping period requests, when the older one resolves last, then the newer period wins", async () => {
    const deferredA = createDeferred<ReturnType<typeof makeResponse>>();
    const deferredB = createDeferred<ReturnType<typeof makeResponse>>();
    mockGetReports.mockReturnValueOnce(deferredA.promise).mockReturnValueOnce(deferredB.promise);

    const { result, rerender } = renderHook(
      ({ from }: { from: string }) => useReports(from, "2026-02-28"),
      { initialProps: { from: "2026-01-01" } },
    );

    // Second request (newer period) starts while the first is still pending.
    rerender({ from: "2026-02-01" });
    expect(mockGetReports).toHaveBeenNthCalledWith(1, "2026-01-01", "2026-02-28");
    expect(mockGetReports).toHaveBeenNthCalledWith(2, "2026-02-01", "2026-02-28");

    // Resolve the NEWER request first, then let the STALE one land last.
    await act(async () => {
      deferredB.resolve(makeResponse(NEWER));
    });
    await act(async () => {
      deferredA.resolve(makeResponse(OLDER));
    });

    // The stale response must NOT overwrite the newer one.
    expect(result.current.data).toEqual(NEWER);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("given a single request, when it rejects, then the report error message is set", async () => {
    mockGetReports.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useReports("2026-01-01", "2026-01-31"));

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("No se pudieron cargar los datos de este informe.");
    expect(result.current.data).toBeNull();
  });
});
