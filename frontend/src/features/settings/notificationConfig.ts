import type { NotificationConfigRequest, ReminderRunResponse } from "@/types/notification";

export const NOTIFICATION_LIMITS = {
  serviceReminderMonths: { min: 1, max: 36 },
  balanceDueDays: { min: 1, max: 180 },
  pickupReminderDays: { min: 1, max: 60 },
} as const;

export function isNotificationConfigValid(config: NotificationConfigRequest): boolean {
  return (Object.keys(NOTIFICATION_LIMITS) as (keyof typeof NOTIFICATION_LIMITS)[]).every(
    (key) => config[key] >= NOTIFICATION_LIMITS[key].min && config[key] <= NOTIFICATION_LIMITS[key].max,
  );
}

export function formatReminderRun(result: ReminderRunResponse): string[] {
  return [
    `Turnos de mañana: ${result.appointmentReminders}`,
    `Service periódico: ${result.serviceReminders}`,
    `Saldo pendiente: ${result.balanceDueReminders}`,
    `Vehículo sin retirar: ${result.pickupReminders}`,
  ];
}

/**
 * Human-readable description of the daily reminders cron (Spring format: sec min hour day month weekday).
 * Only the common "every day at HH:MM" shape is translated; anything else is shown as-is.
 */
export function describeRemindersCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length === 6 && parts[0] === "0" && parts.slice(3).every((p) => p === "*")) {
    const minute = Number(parts[1]);
    const hour = Number(parts[2]);
    if (Number.isInteger(minute) && Number.isInteger(hour)) {
      return `todos los días a las ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }
  return `según la programación "${cron}"`;
}
