import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { usePayments } from "./usePayments";

import type { PaymentResponse } from "@/types/payment";

const mockPayments: PaymentResponse[] = [
  {
    id: 1,
    deliveryNoteId: 10,
    paymentDate: "2025-01-15",
    createdAt: "2025-01-15T10:30:00",
    amount: 500,
    payerName: "Juan Perez",
    paymentType: "EFECTIVO",
    bankAccountId: null,
    bankAccountAlias: null,
    bankName: null,
    registeredByEmployeeId: 1,
    registeredByEmployeeFullName: "Admin",
  },
];

const mockGetByDeliveryNote = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/api/payments", () => ({
  paymentsApi: {
    getByDeliveryNote: (...args: unknown[]) => mockGetByDeliveryNote(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    getSummary: vi.fn(),
  },
}));

describe("usePayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetByDeliveryNote.mockResolvedValue({
      data: { data: mockPayments },
    });
  });

  it("given deliveryNoteId, when mounted, then fetches payments", async () => {
    const { result } = renderHook(() => usePayments(10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetByDeliveryNote).toHaveBeenCalledWith(10);
    expect(result.current.payments).toEqual(mockPayments);
    expect(result.current.error).toBeNull();
  });

  it("given API error, when mounted, then sets error state", async () => {
    mockGetByDeliveryNote.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => usePayments(10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Error al cargar los pagos");
    expect(result.current.payments).toEqual([]);
  });

  it("given valid data, when createPayment called, then triggers refetch", async () => {
    mockCreate.mockResolvedValue({
      data: { data: mockPayments[0] },
    });

    const { result } = renderHook(() => usePayments(10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountBefore = mockGetByDeliveryNote.mock.calls.length;

    await act(async () => {
      await result.current.createPayment({
        paymentDate: "2025-01-15",
        amount: 500,
        payerName: null,
        paymentType: "EFECTIVO",
        bankAccountId: null,
        registeredByEmployeeId: null,
      });
    });

    expect(mockCreate).toHaveBeenCalledWith(10, expect.any(Object));
    expect(mockGetByDeliveryNote.mock.calls.length).toBeGreaterThan(
      callCountBefore,
    );
  });

  it("given valid data, when updatePayment called, then triggers refetch", async () => {
    mockUpdate.mockResolvedValue({
      data: { data: mockPayments[0] },
    });

    const { result } = renderHook(() => usePayments(10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountBefore = mockGetByDeliveryNote.mock.calls.length;

    await act(async () => {
      await result.current.updatePayment(1, {
        paymentDate: "2025-01-15",
        amount: 600,
        payerName: null,
        paymentType: "EFECTIVO",
        bankAccountId: null,
        registeredByEmployeeId: null,
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith(10, 1, expect.any(Object));
    expect(mockGetByDeliveryNote.mock.calls.length).toBeGreaterThan(
      callCountBefore,
    );
  });

  it("given valid payment, when deletePayment called, then triggers refetch", async () => {
    mockDelete.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => usePayments(10));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCountBefore = mockGetByDeliveryNote.mock.calls.length;

    await act(async () => {
      await result.current.deletePayment(1, 2);
    });

    expect(mockDelete).toHaveBeenCalledWith(10, 1, 2);
    expect(mockGetByDeliveryNote.mock.calls.length).toBeGreaterThan(
      callCountBefore,
    );
  });

  it("given hook, when mounted, then loading starts as true", () => {
    mockGetByDeliveryNote.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePayments(10));

    expect(result.current.loading).toBe(true);
  });
});
