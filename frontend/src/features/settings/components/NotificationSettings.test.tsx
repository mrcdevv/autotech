import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationSettings } from "./NotificationSettings";
import { isNotificationConfigValid } from "@/features/settings/notificationConfig";

import type { NotificationConfigResponse } from "@/types/notification";

const { mockGetConfig, mockUpdateConfig } = vi.hoisted(() => ({
  mockGetConfig: vi.fn(),
  mockUpdateConfig: vi.fn(),
}));

vi.mock("@/api/notifications", () => ({
  notificationsApi: { getConfig: mockGetConfig, updateConfig: mockUpdateConfig },
}));

const config: NotificationConfigResponse = {
  remindersEnabled: true,
  appointmentReminderEnabled: true,
  serviceReminderEnabled: true,
  serviceReminderMonths: 6,
  balanceDueEnabled: true,
  balanceDueDays: 7,
  pickupReminderEnabled: true,
  pickupReminderDays: 3,
  mailEnabled: true,
  remindersCron: "0 0 9 * * *",
};

describe("isNotificationConfigValid", () => {
  it("given thresholds out of range, when validating, then returns false", () => {
    expect(isNotificationConfigValid({ ...config, serviceReminderMonths: 0 })).toBe(false);
    expect(isNotificationConfigValid({ ...config, balanceDueDays: 181 })).toBe(false);
    expect(isNotificationConfigValid(config)).toBe(true);
  });
});

describe("NotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockResolvedValue({ data: { data: config } });
    mockUpdateConfig.mockImplementation((data) => Promise.resolve({ data: { data: { ...config, ...data } } }));
  });

  it("given loaded config, when rendering, then shows schedule and reminder types", async () => {
    render(<NotificationSettings />);

    expect(await screen.findByText(/todos los días a las 09:00/)).toBeInTheDocument();
    expect(screen.getByLabelText("Turno del día siguiente")).toBeChecked();
    expect(screen.getByLabelText("Meses desde la entrega")).toHaveValue(6);
  });

  it("given a changed threshold and toggle, when saving, then sends the updated config", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings />);

    const months = await screen.findByLabelText("Meses desde la entrega");
    await user.clear(months);
    await user.type(months, "12");
    await user.click(screen.getByLabelText("Saldo pendiente"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mockUpdateConfig).toHaveBeenCalled());
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ serviceReminderMonths: 12, balanceDueEnabled: false }),
    );
    expect(mockUpdateConfig.mock.calls[0]?.[0]).not.toHaveProperty("mailEnabled");
  });

  it("given mail disabled on the server, when rendering, then shows a warning", async () => {
    mockGetConfig.mockResolvedValue({ data: { data: { ...config, mailEnabled: false } } });

    render(<NotificationSettings />);

    expect(await screen.findByText(/El envío de emails está deshabilitado/)).toBeInTheDocument();
  });
});
