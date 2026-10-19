import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";

import { CalendarSettingsTab } from "./CalendarSettingsTab";

const { updateConfigMock } = vi.hoisted(() => ({
  updateConfigMock: vi.fn(),
}));

vi.mock("@/features/appointments/hooks/useCalendarConfig", () => ({
  useCalendarConfig: () => ({
    config: {
      id: 1,
      defaultAppointmentDurationMinutes: 45,
      startTime: "08:00",
      endTime: "18:00",
      createdAt: "2025-01-01T00:00:00",
      updatedAt: "2025-01-01T00:00:00",
    },
    loading: false,
    error: null,
    updateConfig: updateConfigMock,
    refetch: vi.fn(),
  }),
}));

const renderComponent = () =>
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <CalendarSettingsTab />
    </LocalizationProvider>
  );

describe("CalendarSettingsTab", () => {
  it("given config loaded, when rendered, then shows duration and business hours fields with loaded values", () => {
    renderComponent();

    expect(screen.getByText("Duración de citas por defecto")).toBeInTheDocument();
    expect(screen.getByText("Horario comercial")).toBeInTheDocument();
    expect(screen.getByLabelText("Duración (minutos)")).toHaveValue(45);
    expect(screen.getByLabelText("Horario de inicio")).toHaveValue("08:00");
    expect(screen.getByLabelText("Horario de fin")).toHaveValue("18:00");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
    expect(screen.queryByText("Etiquetas")).not.toBeInTheDocument();
  });

  it("given config loaded, when clicking Guardar, then calls updateConfig with duration and business hours", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(updateConfigMock).toHaveBeenCalledWith({
      defaultAppointmentDurationMinutes: 45,
      startTime: "08:00",
      endTime: "18:00",
    });
  });
});
