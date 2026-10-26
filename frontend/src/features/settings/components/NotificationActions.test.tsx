import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationActions } from "./NotificationActions";

const { mockRun, mockTest } = vi.hoisted(() => ({ mockRun: vi.fn(), mockTest: vi.fn() }));

vi.mock("@/api/notifications", () => ({
  notificationsApi: { runReminders: mockRun, sendTestEmail: mockTest },
}));

vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({ user: { email: "admin@autotech.com", firstName: "Admin", lastName: "Autotech" } }),
}));

describe("NotificationActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given the logged user, when rendering, then pre-fills the test email recipient", () => {
    render(<NotificationActions />);

    expect(screen.getByLabelText("Enviar a")).toHaveValue("admin@autotech.com");
  });

  it("given a successful run, when clicking run now, then shows counts per reminder type", async () => {
    const user = userEvent.setup();
    mockRun.mockResolvedValue({
      data: {
        message: "Se enviaron 4 recordatorios",
        data: { appointmentReminders: 2, serviceReminders: 1, balanceDueReminders: 0, pickupReminders: 1 },
      },
    });
    render(<NotificationActions />);

    await user.click(screen.getByRole("button", { name: "Ejecutar recordatorios ahora" }));

    expect(await screen.findByText("Se enviaron 4 recordatorios")).toBeInTheDocument();
    expect(screen.getByText("Turnos de mañana: 2")).toBeInTheDocument();
    expect(screen.getByText("Vehículo sin retirar: 1")).toBeInTheDocument();
  });

  it("given an SMTP failure, when sending a test email, then shows the server message", async () => {
    const user = userEvent.setup();
    mockTest.mockRejectedValue(
      Object.assign(new Error("400"), {
        isAxiosError: true,
        response: { data: { message: "No se pudo enviar el email de prueba: Connection refused" } },
      }),
    );
    render(<NotificationActions />);

    await user.click(screen.getByRole("button", { name: "Enviar email de prueba" }));

    await waitFor(() => expect(screen.getByText(/Connection refused/)).toBeInTheDocument());
    expect(mockTest).toHaveBeenCalledWith("admin@autotech.com");
  });
});
