import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useFaults } from "./useFaults";

import type { FaultCountResponse } from "@/features/dashboard/types";

const mockGetReportFaults = vi.fn();

vi.mock("@/api/dashboard", () => ({
  dashboardApi: {
    getReportFaults: (...args: unknown[]) => mockGetReportFaults(...args),
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

function makeResponse(payload: FaultCountResponse[]) {
  return { data: { data: payload } };
}

const OLDER: FaultCountResponse[] = [{ faultName: "Freno", count: 3 }];

const NEWER: FaultCountResponse[] = [{ faultName: "Motor", count: 7 }];

describe("useFaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given two overlapping period requests, when the older one resolves last, then the newer period wins", async () => {
    const deferredA = createDeferred<ReturnType<typeof makeResponse>>();
    const deferredB = createDeferred<ReturnType<typeof makeResponse>>();
    mockGetReportFaults.mockReturnValueOnce(deferredA.promise).mockReturnValueOnce(deferredB.promise);

    const { result, rerender } = renderHook(
      ({ from }: { from: string }) => useFaults(from, "2026-02-28", null),
      { initialProps: { from: "2026-01-01" } },
    );

    // Second request (newer period) starts while the first is still pending.
    rerender({ from: "2026-02-01" });
    expect(mockGetReportFaults).toHaveBeenNthCalledWith(1, "2026-01-01", "2026-02-28", null);
    expect(mockGetReportFaults).toHaveBeenNthCalledWith(2, "2026-02-01", "2026-02-28", null);

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
    mockGetReportFaults.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useFaults("2026-01-01", "2026-01-31", null));

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("No se pudieron cargar los datos de este informe.");
    expect(result.current.data).toEqual([]);
  });
});
