import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useGuardedRequest } from "./useGuardedRequest";

const mockFetcher = vi.fn();

const ERROR_MESSAGE = "Error de prueba";

type Payload = { value: number };

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderHelper(initialDeps: readonly unknown[]) {
  return renderHook(
    ({ deps }: { deps: readonly unknown[] }) =>
      useGuardedRequest<Payload>(mockFetcher, ERROR_MESSAGE, deps),
    { initialProps: { deps: initialDeps } },
  );
}

describe("useGuardedRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given two overlapping requests, when the older one resolves last, then the newer response wins", async () => {
    const deferredA = createDeferred<Payload>();
    const deferredB = createDeferred<Payload>();
    mockFetcher.mockReturnValueOnce(deferredA.promise).mockReturnValueOnce(deferredB.promise);

    const { result, rerender } = renderHelper([1]);

    // Second request (newer deps) starts while the first is still pending.
    rerender({ deps: [2] });
    expect(mockFetcher).toHaveBeenCalledTimes(2);

    // Resolve the NEWER request first, then let the STALE one land last.
    await act(async () => {
      deferredB.resolve({ value: 2 });
    });
    await act(async () => {
      deferredA.resolve({ value: 1 });
    });

    // The stale response must NOT overwrite the newer one.
    expect(result.current.data).toEqual({ value: 2 });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("given a stale failing request, when it settles while a newer request is pending, then loading stays true and no error is set", async () => {
    const deferredA = createDeferred<Payload>();
    const deferredB = createDeferred<Payload>();
    mockFetcher.mockReturnValueOnce(deferredA.promise).mockReturnValueOnce(deferredB.promise);

    const { result, rerender } = renderHelper([1]);

    rerender({ deps: [2] });

    // The stale request fails while the newer one is still in flight.
    await act(async () => {
      deferredA.reject(new Error("boom"));
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      deferredB.resolve({ value: 2 });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({ value: 2 });
  });

  it("given a single request, when it rejects, then the configured error message is set", async () => {
    const deferred = createDeferred<Payload>();
    mockFetcher.mockReturnValueOnce(deferred.promise);

    const { result } = renderHelper([1]);

    await act(async () => {
      deferred.reject(new Error("boom"));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(ERROR_MESSAGE);
    expect(result.current.data).toBeNull();
  });

  it("given the hook is mounted, when refetch is called, then a new request runs with the same deps", async () => {
    mockFetcher.mockResolvedValueOnce({ value: 1 });

    const { result } = renderHelper([1]);

    await act(async () => {});
    expect(result.current.data).toEqual({ value: 1 });
    expect(result.current.loading).toBe(false);

    mockFetcher.mockResolvedValueOnce({ value: 9 });
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockFetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ value: 9 });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
