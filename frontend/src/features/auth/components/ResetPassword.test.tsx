import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResetPassword } from "./ResetPassword";
import { validateNewPassword } from "@/features/auth/passwordValidation";

const { mockResetPassword } = vi.hoisted(() => ({ mockResetPassword: vi.fn() }));

vi.mock("../api/authApi", () => ({
  authApi: { resetPassword: mockResetPassword },
}));

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ResetPassword />
    </MemoryRouter>,
  );
}

describe("validateNewPassword", () => {
  it("given short password, when validating, then returns length error", () => {
    expect(validateNewPassword("123", "123").newPassword).toMatch(/al menos 6/);
  });

  it("given different confirmation, when validating, then returns mismatch error", () => {
    expect(validateNewPassword("secreto1", "secreto2").confirmPassword).toBe("Las contraseñas no coinciden");
  });

  it("given valid matching passwords, when validating, then returns no errors", () => {
    expect(validateNewPassword("secreto1", "secreto1")).toEqual({});
  });
});

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given no token in the URL, when rendering, then shows invalid link message", () => {
    renderAt("/restablecer");

    expect(screen.getByText(/El enlace es inválido/)).toBeInTheDocument();
  });

  it("given a token, when submitting matching passwords, then calls API and shows success", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ data: { status: "success", message: "ok", data: null } });
    renderAt("/restablecer?token=abc123");

    await user.type(screen.getByLabelText(/Contraseña nueva/), "secreto1");
    await user.type(screen.getByLabelText(/Repetir contraseña/), "secreto1");
    await user.click(screen.getByRole("button", { name: /Guardar contraseña/ }));

    await waitFor(() => expect(screen.getByText(/tu contraseña fue actualizada/)).toBeInTheDocument());
    expect(mockResetPassword).toHaveBeenCalledWith({ token: "abc123", newPassword: "secreto1" });
  });

  it("given an expired token, when submitting, then shows the server error", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockRejectedValue(
      Object.assign(new Error("400"), {
        isAxiosError: true,
        response: { data: { message: "El enlace para restablecer la contraseña es inválido o venció." } },
      }),
    );
    renderAt("/restablecer?token=old");

    await user.type(screen.getByLabelText(/Contraseña nueva/), "secreto1");
    await user.type(screen.getByLabelText(/Repetir contraseña/), "secreto1");
    await user.click(screen.getByRole("button", { name: /Guardar contraseña/ }));

    await waitFor(() => expect(screen.getByText(/inválido o venció/)).toBeInTheDocument());
  });
});
