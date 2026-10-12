import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useFinanciero } from "./useFinanciero";

const mockGetFinanciero = vi.fn();

vi.mock("@/api/dashboard", () => ({
  dashboardApi: {
    getFinanciero: (...args: unknown[]) => mockGetFinanciero(...args),
    exportFinanciero: vi.fn().mockResolvedValue({
      data: new Blob(),
    }),
  },
}));

const DEFAULT_FINANCIERO = {
  monthlyRevenue: [],
  estimateConversionRate: 80,
  estimatesAccepted: 8,
  estimatesTotal: 10,
  totalPendingBilling: 15000,
  debtAging: [],
  topUnpaidInvoices: [],
};

function makeResponse(payload: unknown) {
  return { data: { data: payload } };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useFinanciero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFinanciero.mockResolvedValue(makeResponse(DEFAULT_FINANCIERO));
  });

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

  it("given two overlapping month requests, when the older one resolves last, then the newer months win", async () => {
    const deferredA = createDeferred<ReturnType<typeof makeResponse>>();
    const deferredB = createDeferred<ReturnType<typeof makeResponse>>();
    mockGetFinanciero.mockReturnValueOnce(deferredA.promise).mockReturnValueOnce(deferredB.promise);

    const { result, rerender } = renderHook(
      ({ months }: { months: number }) => useFinanciero(months),
      { initialProps: { months: 6 } },
    );

    // Second request (newer months) starts while the first is still pending.
    rerender({ months: 12 });
    expect(mockGetFinanciero).toHaveBeenNthCalledWith(1, 6);
    expect(mockGetFinanciero).toHaveBeenNthCalledWith(2, 12);

    // Resolve the NEWER request first, then let the STALE one land last.
    await act(async () => {
      deferredB.resolve(makeResponse({ ...DEFAULT_FINANCIERO, estimateConversionRate: 50 }));
    });
    await act(async () => {
      deferredA.resolve(makeResponse({ ...DEFAULT_FINANCIERO, estimateConversionRate: 90 }));
    });

    // The stale response must NOT overwrite the newer one.
    expect(result.current.data?.estimateConversionRate).toBe(50);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("given a stale failing request, when it settles while a newer request is pending, then loading stays true and no error is set", async () => {
    const deferredA = createDeferred<ReturnType<typeof makeResponse>>();
    const deferredB = createDeferred<ReturnType<typeof makeResponse>>();
    mockGetFinanciero.mockReturnValueOnce(deferredA.promise).mockReturnValueOnce(deferredB.promise);

    const { result, rerender } = renderHook(
      ({ months }: { months: number }) => useFinanciero(months),
      { initialProps: { months: 6 } },
    );

    rerender({ months: 12 });

    // The stale request fails while the newer one is still in flight.
    await act(async () => {
      deferredA.reject(new Error("boom"));
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      deferredB.resolve(makeResponse({ ...DEFAULT_FINANCIERO, estimateConversionRate: 50 }));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.estimateConversionRate).toBe(50);
  });
});
