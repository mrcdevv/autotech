package com.autotech.notification.dto;

/**
 * Number of reminders sent per type in one run.
 */
public record ReminderRunResponse(
        int appointmentReminders,
        int serviceReminders,
        int balanceDueReminders,
        int pickupReminders
) {

    public static ReminderRunResponse none() {
        return new ReminderRunResponse(0, 0, 0, 0);
    }

    public int total() {
        return appointmentReminders + serviceReminders + balanceDueReminders + pickupReminders;
    }
}
