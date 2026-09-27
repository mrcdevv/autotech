import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useMechanics } from "./useMechanics";

import type { EmployeeResponse } from "@/features/employees/types";

const mockGetAllRoles = vi.fn();
const mockFilterByRole = vi.fn();

vi.mock("@/api/roles", () => ({
  rolesApi: {
    getAll: (...args: unknown[]) => mockGetAllRoles(...args),
  },
}));

vi.mock("@/api/employees", () => ({
  employeesApi: {
    filterByRole: (...args: unknown[]) => mockFilterByRole(...args),
  },
}));

function buildEmployee(id: number, status: "ACTIVO" | "INACTIVO"): EmployeeResponse {
  return {
    id,
    firstName: "Carlos",
    lastName: "Lopez",
    dni: `dni-${id}`,
    email: null,
    phone: "1234567890",
    address: null,
    province: null,
    city: null,
    country: null,
    maritalStatus: null,
    childrenCount: 0,
    entryDate: null,
    status,
    roles: [{ id: 3, name: "MECANICO", description: "" }],
    createdAt: "",
    updatedAt: "",
  };
}

describe("useMechanics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllRoles.mockResolvedValue({
      data: { data: [{ id: 3, name: "MECANICO", description: "" }] },
    });
  });

  it("given MECANICO role, when mounted, then fetches mechanics filtered by role", async () => {
    mockFilterByRole.mockResolvedValue({
      data: { data: { content: [buildEmployee(1, "ACTIVO"), buildEmployee(2, "ACTIVO")] } },
    });

    const { result } = renderHook(() => useMechanics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFilterByRole).toHaveBeenCalledWith(3, 0, 100);
    expect(result.current.mechanics).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it("given inactive mechanics, when mounted, then excludes them", async () => {
    mockFilterByRole.mockResolvedValue({
      data: { data: { content: [buildEmployee(1, "ACTIVO"), buildEmployee(2, "INACTIVO")] } },
    });

    const { result } = renderHook(() => useMechanics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.mechanics.map((m) => m.id)).toEqual([1]);
  });

  it("given missing MECANICO role, when mounted, then returns empty without employee query", async () => {
    mockGetAllRoles.mockResolvedValue({
      data: { data: [{ id: 1, name: "ADMINISTRADOR", description: "" }] },
    });

    const { result } = renderHook(() => useMechanics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFilterByRole).not.toHaveBeenCalled();
    expect(result.current.mechanics).toEqual([]);
  });

  it("given API error, when mounted, then sets error and returns empty", async () => {
    mockGetAllRoles.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMechanics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Error al cargar los mecánicos");
    expect(result.current.mechanics).toEqual([]);
  });

  it("given enabled false, when mounted, then does not fetch", () => {
    renderHook(() => useMechanics(false));

    expect(mockGetAllRoles).not.toHaveBeenCalled();
  });
});
