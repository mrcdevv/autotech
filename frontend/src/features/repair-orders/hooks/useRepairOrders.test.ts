import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useRepairOrders } from "./useRepairOrders";

import type { RepairOrderListParams } from "@/api/repairOrders";
import type { RepairOrderResponse } from "../types";

const mockSearch = vi.fn();

vi.mock("@/api/repairOrders", () => ({
  repairOrdersApi: {
    search: (...args: unknown[]) => mockSearch(...args),
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

function buildOrder(id: number): RepairOrderResponse {
  return {
    id,
    title: `Orden ${id}`,
    status: "INGRESO_VEHICULO",
    clientId: id,
    clientFirstName: "Cliente",
    clientLastName: `${id}`,
    clientPhone: "1234567890",
    vehicleId: id,
    vehiclePlate: `ABC-${id}`,
    vehicleBrandName: null,
    vehicleModel: null,
    vehicleYear: null,
    employees: [],
    tags: [],
    createdAt: "",
    updatedAt: "",
  };
}

function makeResponse(orders: RepairOrderResponse[], totalElements: number) {
  return { data: { data: { content: orders, totalElements } } };
}

describe("useRepairOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given two overlapping requests, when the older one resolves last, then the newer response wins", async () => {
    const deferredA = createDeferred<ReturnType<typeof makeResponse>>();
    const deferredB = createDeferred<ReturnType<typeof makeResponse>>();
    mockSearch.mockReturnValueOnce(deferredA.promise).mockReturnValueOnce(deferredB.promise);

    const { result, rerender } = renderHook(
      ({ params }: { params: RepairOrderListParams }) => useRepairOrders(params),
      { initialProps: { params: { q: "alpha" } as RepairOrderListParams } },
    );

    // Second request (newer params) starts while the first is still pending.
    rerender({ params: { q: "beta" } });
    expect(mockSearch).toHaveBeenNthCalledWith(1, expect.objectContaining({ q: "alpha" }));
    expect(mockSearch).toHaveBeenNthCalledWith(2, expect.objectContaining({ q: "beta" }));

    // Resolve the NEWER request first, then let the STALE one land last.
    await act(async () => {
      deferredB.resolve(makeResponse([buildOrder(2)], 1));
    });
    await act(async () => {
      deferredA.resolve(makeResponse([buildOrder(1)], 99));
    });

    // The stale response must NOT overwrite the newer one.
    expect(result.current.orders.map((o) => o.id)).toEqual([2]);
    expect(result.current.totalElements).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("given a stale failing request, when it settles while a newer request is pending, then loading stays true and no error is set", async () => {
    const deferredA = createDeferred<ReturnType<typeof makeResponse>>();
    const deferredB = createDeferred<ReturnType<typeof makeResponse>>();
    mockSearch.mockReturnValueOnce(deferredA.promise).mockReturnValueOnce(deferredB.promise);

    const { result, rerender } = renderHook(
      ({ params }: { params: RepairOrderListParams }) => useRepairOrders(params),
      { initialProps: { params: { q: "alpha" } as RepairOrderListParams } },
    );

    rerender({ params: { q: "beta" } });

    // The stale request fails while the newer one is still in flight.
    await act(async () => {
      deferredA.reject(new Error("boom"));
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      deferredB.resolve(makeResponse([buildOrder(2)], 1));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.orders.map((o) => o.id)).toEqual([2]);
  });

  it("given a single param change, when it resolves, then shows the new params data", async () => {
    mockSearch.mockResolvedValueOnce(makeResponse([buildOrder(1)], 1));

    const { result, rerender } = renderHook(
      ({ params }: { params: RepairOrderListParams }) => useRepairOrders(params),
      { initialProps: { params: { q: "alpha" } as RepairOrderListParams } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.orders.map((o) => o.id)).toEqual([1]);
    expect(result.current.error).toBeNull();

    mockSearch.mockResolvedValueOnce(makeResponse([buildOrder(2)], 5));
    rerender({ params: { q: "beta" } });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenLastCalledWith(expect.objectContaining({ q: "beta" }));
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.orders.map((o) => o.id)).toEqual([2]);
    expect(result.current.totalElements).toBe(5);
  });

  it("given the hook is mounted, when refetch is called, then it re-requests with the current params", async () => {
    mockSearch.mockResolvedValue(makeResponse([buildOrder(1)], 1));

    const { result } = renderHook(() => useRepairOrders({ q: "alpha" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockSearch.mockClear();
    mockSearch.mockResolvedValueOnce(makeResponse([buildOrder(3)], 7));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ q: "alpha" }));
    expect(result.current.orders.map((o) => o.id)).toEqual([3]);
    expect(result.current.totalElements).toBe(7);
    expect(result.current.loading).toBe(false);
  });
});
