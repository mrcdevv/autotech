import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RolesSettings } from "./RolesSettings";

import type { RoleResponse } from "@/types/role";

const { mockGetAllRoles, mockGetAllPermissions } = vi.hoisted(() => ({
  mockGetAllRoles: vi.fn(),
  mockGetAllPermissions: vi.fn(),
}));

vi.mock("@/api/roles", () => ({
  rolesApi: {
    getAll: mockGetAllRoles,
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/api/permissions", () => ({
  permissionsApi: {
    getAll: mockGetAllPermissions,
  },
}));

const mockRoles: RoleResponse[] = [
  {
    id: 1,
    name: "Administrador",
    description: "Acceso total",
    permissions: [
      { id: 1, code: "roles.read", description: "Ver roles" },
      { id: 2, code: "roles.write", description: "Editar roles" },
    ],
    createdAt: "2025-01-01T00:00:00",
    updatedAt: "2025-01-01T00:00:00",
  },
];

describe("RolesSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllRoles.mockResolvedValue({ data: { data: mockRoles } });
    mockGetAllPermissions.mockResolvedValue({
      data: {
        data: [
          { id: 1, code: "roles.read", description: "Ver roles" },
          { id: 2, code: "roles.write", description: "Editar roles" },
        ],
      },
    });
  });

  it("given roles exist, when rendered, then lists roles with permission count", async () => {
    render(<RolesSettings />);

    expect(await screen.findByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("Acceso total — 2 permisos")).toBeInTheDocument();
  });

  it("given add button, when clicked, then loads available permissions", async () => {
    const user = userEvent.setup();
    render(<RolesSettings />);

    await user.click(await screen.findByRole("button", { name: "Agregar rol" }));

    await waitFor(() => {
      expect(mockGetAllPermissions).toHaveBeenCalled();
    });
  });
});
