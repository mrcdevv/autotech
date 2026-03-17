import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { usePaymentSummary } from "./usePaymentSummary";

import type { PaymentSummaryResponse } from "@/types/payment";

const mockSummary: PaymentSummaryResponse = {
  totalServices: 1000,
  totalProducts: 200,
  taxAmount: 226.8,
  discountAmount: 120,
  total: 1306.8,
  totalPaid: 500,
  remaining: 806.8,
};

const mockGetSummary = vi.fn();

vi.mock("@/api/payments", () => ({
  paymentsApi: {
    getSummary: (...args: unknown[]) => mockGetSummary(...args),
    getByInvoice: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("usePaymentSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSummary.mockResolvedValue({
      data: { data: mockSummary },
    });
  });

  it("given invoiceId, when mounted, then fetches summary", async () => {
    const { result } = renderHook(() => usePaymentSummary(10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetSummary).toHaveBeenCalledWith(10);
    expect(result.current.summary).toEqual(mockSummary);
    expect(result.current.error).toBeNull();
  });

  it("given API error, when mounted, then sets error state", async () => {
    mockGetSummary.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => usePaymentSummary(10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Error al cargar el resumen de pagos");
    expect(result.current.summary).toBeNull();
  });

  it("given hook, when refetch called, then updates summary", async () => {
    const { result } = renderHook(() => usePaymentSummary(10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedSummary: PaymentSummaryResponse = {
      ...mockSummary,
      totalPaid: 1306.8,
      remaining: 0,
    };
    mockGetSummary.mockResolvedValueOnce({
      data: { data: updatedSummary },
    });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.summary).toEqual(updatedSummary);
    });
  });

  it("given hook, when mounted, then loading starts as true", () => {
    mockGetSummary.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePaymentSummary(10));

    expect(result.current.loading).toBe(true);
  });
});
