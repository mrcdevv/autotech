package com.autotech.notification.service;

import com.autotech.notification.dto.ReminderRunResponse;

public interface ReminderService {

    /**
     * Sends every enabled reminder that is due and was not sent before. Safe to run several times a day.
     */
    ReminderRunResponse runReminders();
}
