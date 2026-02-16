import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { CalendarSettingsTab } from "./CalendarSettingsTab";

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
    updateConfig: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/settings/components/TagsManager", () => ({
  TagsManager: () => <div data-testid="tags-manager">TagsManager</div>,
}));

describe("CalendarSettingsTab", () => {
  it("given config loaded, when rendered, then shows duration and TagsManager", () => {
    render(<CalendarSettingsTab />);

    expect(screen.getByText("Duración de citas por defecto")).toBeInTheDocument();
    expect(screen.getByLabelText("Duración (minutos)")).toHaveValue(45);
    expect(screen.getByText("Guardar")).toBeInTheDocument();
    expect(screen.getByText("Etiquetas")).toBeInTheDocument();
    expect(screen.getByTestId("tags-manager")).toBeInTheDocument();
  });
});
