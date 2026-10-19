import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";
import { authApi } from "../api/authApi";
import type { CurrentUserResponse, LoginResponse } from "../types";

vi.mock("../api/authApi", () => ({
  authApi: { me: vi.fn() },
}));

const loginResponse: LoginResponse = {
  accessToken: "token",
  tokenType: "Bearer",
  mustChangePassword: false,
  email: "mecanico@autotech.com",
  firstName: "Juan",
  lastName: "Pérez",
  roles: ["MECANICO"],
  permissions: ["read_client", "read_order"],
};

let auth: ReturnType<typeof useAuth> | null = null;

function Probe() {
  auth = useAuth();
  return <div>{auth.isLoading ? "cargando" : "listo"}</div>;
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    auth = null;
  });

  afterEach(() => {
    vi.mocked(authApi.me).mockReset();
  });

  it("given login response, when logging in, then exposes permissions through hasPermission", async () => {
    renderProvider();
    await screen.findByText("listo");

    act(() => auth!.login(loginResponse));

    expect(auth!.hasPermission("read_order")).toBe(true);
    expect(auth!.hasPermission("create_client")).toBe(false);
    expect(auth!.hasAnyPermission(["create_client", "read_client"])).toBe(true);
    expect(JSON.parse(localStorage.getItem("user")!).permissions).toEqual(["read_client", "read_order"]);
  });

  it("given stored session, when mounting, then refreshes permissions from /auth/me", async () => {
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify({ ...loginResponse, permissions: ["read_client"] }));
    const currentUser: CurrentUserResponse = {
      id: 1,
      email: loginResponse.email,
      firstName: loginResponse.firstName,
      lastName: loginResponse.lastName,
      mustChangePassword: false,
      roles: ["MECANICO"],
      permissions: ["read_client", "create_order"],
    };
    vi.mocked(authApi.me).mockResolvedValue({
      data: { status: "success", message: null, data: currentUser },
    } as unknown as Awaited<ReturnType<typeof authApi.me>>);

    renderProvider();
    await screen.findByText("listo");

    await waitFor(() => expect(auth!.hasPermission("create_order")).toBe(true));
    expect(authApi.me).toHaveBeenCalledTimes(1);
  });

  it("given session stored before permissions existed, when mounting, then has no permissions until refreshed", async () => {
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify({ email: "a@b.com", firstName: "A", lastName: "B", mustChangePassword: false }));
    vi.mocked(authApi.me).mockRejectedValue(new Error("network"));

    renderProvider();
    await screen.findByText("listo");

    expect(auth!.isAuthenticated).toBe(true);
    expect(auth!.hasPermission("read_client")).toBe(false);
  });
});
