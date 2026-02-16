import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useTags } from "./useTags";

import type { TagResponse } from "@/types/appointment";

const mockTags: TagResponse[] = [
  { id: 1, name: "Urgente", color: "#FF0000" },
  { id: 2, name: "VIP", color: "#00FF00" },
];

const mockGetAll = vi.fn();

vi.mock("@/api/tags", () => ({
  tagsApi: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("useTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue({ data: { data: mockTags } });
  });

  it("given hook, when mounted, then fetches tags", async () => {
    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetAll).toHaveBeenCalled();
    expect(result.current.tags).toEqual(mockTags);
    expect(result.current.error).toBeNull();
  });

  it("given API error, when mounted, then sets error state", async () => {
    mockGetAll.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Error al cargar etiquetas");
    expect(result.current.tags).toEqual([]);
  });

  it("given hook, when mounted, then loading starts as true", () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useTags());

    expect(result.current.loading).toBe(true);
  });
});
