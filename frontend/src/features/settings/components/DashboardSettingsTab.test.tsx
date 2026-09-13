import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { DashboardSettingsTab } from "./DashboardSettingsTab";

vi.mock("@/api/dashboard", () => ({
  dashboardApi: {
    getConfig: vi.fn().mockResolvedValue({
      data: { data: { staleThresholdDays: 5 } },
    }),
    updateConfig: vi.fn().mockResolvedValue({
      data: { data: { staleThresholdDays: 10 } },
    }),
  },
}));

describe("DashboardSettingsTab", () => {
  it("given config loaded, when rendered, then shows threshold field", async () => {
    render(<DashboardSettingsTab />);

    await waitFor(() => {
      expect(screen.getByLabelText("Días de inactividad para alerta")).toBeInTheDocument();
    });
  });

  it("given config loaded, when rendered, then shows save button", async () => {
    render(<DashboardSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Guardar")).toBeInTheDocument();
    });
  });

  it("given valid value, when saving, then shows success message", async () => {
    const user = userEvent.setup();
    render(<DashboardSettingsTab />);

    await waitFor(() => {
      expect(screen.getByLabelText("Días de inactividad para alerta")).toBeInTheDocument();
    });

    const input = screen.getByLabelText("Días de inactividad para alerta");
    await user.clear(input);
    await user.type(input, "10");
    await user.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(screen.getByText("Configuración guardada")).toBeInTheDocument();
    });
  });
});
