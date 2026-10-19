import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { RequirePermission } from "./RequirePermission";

const granted = vi.hoisted(() => ({ codes: new Set<string>() }));

vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    hasAnyPermission: (codes: string[]) => codes.some((code) => granted.codes.has(code)),
  }),
}));

function renderGuarded(permissions: string[], required: Parameters<typeof RequirePermission>[0]["permission"]) {
  granted.codes = new Set(permissions);
  return render(
    <MemoryRouter initialEntries={["/reportes"]}>
      <Routes>
        <Route element={<RequirePermission permission={required} />}>
          <Route path="/reportes" element={<div>Contenido protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequirePermission", () => {
  it("given user with permission, when rendering route, then shows the page", () => {
    renderGuarded(["view_reports"], "view_reports");

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it("given user without permission, when rendering route, then shows no access message", () => {
    renderGuarded(["read_client"], "view_reports");

    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
    expect(screen.getByText("Sin permisos")).toBeInTheDocument();
    expect(screen.getByText("No tiene permisos para acceder a esta sección.")).toBeInTheDocument();
  });

  it("given list of permissions, when user holds any of them, then shows the page", () => {
    renderGuarded(["manage_services"], ["manage_config", "manage_services"]);

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });
});
