package com.autotech.notification.dto;

public record NotificationConfigResponse(
        Boolean remindersEnabled,
        Boolean appointmentReminderEnabled,
        Boolean serviceReminderEnabled,
        Integer serviceReminderMonths,
        Boolean balanceDueEnabled,
        Integer balanceDueDays,
        Boolean pickupReminderEnabled,
        Integer pickupReminderDays,
        boolean mailEnabled,
        String remindersCron
) {}
