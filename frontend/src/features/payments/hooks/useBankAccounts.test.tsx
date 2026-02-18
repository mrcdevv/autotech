import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useBankAccounts } from "./useBankAccounts";

import type { BankAccountResponse, BankResponse } from "@/types/payment";

const mockAccounts: BankAccountResponse[] = [
  {
    id: 1,
    bankId: 10,
    bankName: "Banco Nacion",
    alias: "Cuenta principal",
    cbuCvu: "1234567890",
    createdAt: "2025-01-01T00:00:00",
  },
];

const mockBanks: BankResponse[] = [
  { id: 10, name: "Banco Nacion" },
  { id: 20, name: "Mercadopago" },
];

const mockGetAll = vi.fn();
const mockGetAllBanks = vi.fn();

vi.mock("@/api/bankAccounts", () => ({
  bankAccountsApi: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    getAllBanks: (...args: unknown[]) => mockGetAllBanks(...args),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("useBankAccounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue({ data: { data: mockAccounts } });
    mockGetAllBanks.mockResolvedValue({ data: { data: mockBanks } });
  });

  it("given hook, when mounted, then fetches bank accounts and banks", async () => {
    const { result } = renderHook(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetAll).toHaveBeenCalled();
    expect(mockGetAllBanks).toHaveBeenCalled();
    expect(result.current.bankAccounts).toEqual(mockAccounts);
    expect(result.current.banks).toEqual(mockBanks);
    expect(result.current.error).toBeNull();
  });

  it("given API error, when mounted, then sets error state", async () => {
    mockGetAll.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      "Error al cargar las cuentas bancarias",
    );
    expect(result.current.bankAccounts).toEqual([]);
    expect(result.current.banks).toEqual([]);
  });

  it("given hook, when mounted, then loading starts as true", () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    mockGetAllBanks.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useBankAccounts());

    expect(result.current.loading).toBe(true);
  });
});
