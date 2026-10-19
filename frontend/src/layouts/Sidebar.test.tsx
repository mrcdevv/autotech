import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import Sidebar from "./Sidebar";

const granted = vi.hoisted(() => ({ codes: new Set<string>() }));

vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    user: { firstName: "Juan", lastName: "Pérez", email: "juan@autotech.com" },
    logout: vi.fn(),
    hasAnyPermission: (codes: string[]) => codes.some((code) => granted.codes.has(code)),
  }),
}));

function renderSidebar(permissions: string[]) {
  granted.codes = new Set(permissions);
  return render(
    <MemoryRouter>
      <Sidebar open onClose={vi.fn()} />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  it("given mechanic permissions, when rendered, then hides items without permission", () => {
    renderSidebar(["read_client", "read_vehicle", "read_employee", "read_order", "read_estimate", "read_delivery_note", "read_appointment"]);

    expect(screen.getByLabelText("Órdenes de trabajo")).toBeInTheDocument();
    expect(screen.getByLabelText("Clientes")).toBeInTheDocument();
    expect(screen.getByLabelText("Servicios")).toBeInTheDocument();
    expect(screen.queryByLabelText("Reportes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Configuración")).not.toBeInTheDocument();
  });

  it("given administrator permissions, when rendered, then shows reports and settings", () => {
    renderSidebar(["view_reports", "manage_config", "read_employee"]);

    expect(screen.getByLabelText("Reportes")).toBeInTheDocument();
    expect(screen.getByLabelText("Configuración")).toBeInTheDocument();
    expect(screen.getByLabelText("Empleados")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clientes")).not.toBeInTheDocument();
  });

  it("given no permissions, when rendered, then hides empty sections", () => {
    renderSidebar([]);

    expect(screen.getByLabelText("Inicio")).toBeInTheDocument();
    expect(screen.queryByText("Taller")).not.toBeInTheDocument();
    expect(screen.queryByText("Administración")).not.toBeInTheDocument();
  });
});
