import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";

import apiClient, { FORBIDDEN_EVENT } from "./client";

function rejectWith(status: number, data: unknown): AxiosAdapter {
  return (config: InternalAxiosRequestConfig) => {
    const response = { status, data, config, headers: {}, statusText: "" } as AxiosResponse;
    return Promise.reject(new AxiosError("error", String(status), config, null, response));
  };
}

describe("apiClient 403 handling", () => {
  const originalAdapter = apiClient.defaults.adapter;
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, pathname: "/clientes", href: "/clientes" },
    });
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("given 403 without code, when calling API, then dispatches forbidden event", async () => {
    const listener = vi.fn();
    window.addEventListener(FORBIDDEN_EVENT, listener);
    apiClient.defaults.adapter = rejectWith(403, { status: "error", message: "No tiene permisos" });

    await expect(apiClient.get("/roles")).rejects.toBeInstanceOf(AxiosError);

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(FORBIDDEN_EVENT, listener);
  });

  it("given 403 password change required, when calling API, then redirects to change password", async () => {
    const listener = vi.fn();
    window.addEventListener(FORBIDDEN_EVENT, listener);
    localStorage.setItem("user", JSON.stringify({ email: "a@b.com", mustChangePassword: false }));
    apiClient.defaults.adapter = rejectWith(403, {
      status: "error",
      message: "Debe cambiar su contraseña antes de continuar",
      data: { code: "PASSWORD_CHANGE_REQUIRED" },
    });

    await expect(apiClient.get("/clients")).rejects.toBeInstanceOf(AxiosError);

    expect(window.location.href).toBe("/change-password");
    expect(JSON.parse(localStorage.getItem("user")!).mustChangePassword).toBe(true);
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(FORBIDDEN_EVENT, listener);
  });
});
