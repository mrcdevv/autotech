package com.autotech.notification.model;

/**
 * Scheduled reminders. Each one is sent at most once per referenced record (see notification_log).
 */
public enum NotificationType {
    /** reference: appointment id */
    APPOINTMENT_REMINDER,
    /** reference: the last delivered repair order of the vehicle */
    SERVICE_REMINDER,
    /** reference: delivery note id */
    BALANCE_DUE,
    /** reference: repair order id */
    PICKUP_REMINDER
}
