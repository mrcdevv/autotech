package com.autotech.notification.service;

import com.autotech.email.service.EmailService;
import com.autotech.notification.dto.ReminderRunResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final ReminderService reminderService;
    private final EmailService emailService;

    @Scheduled(cron = "${autotech.notifications.reminders-cron:0 0 9 * * *}",
            zone = "${autotech.app.time-zone:America/Argentina/Cordoba}")
    public void runDailyReminders() {
        if (!emailService.isEnabled()) {
            log.info("Skipping daily reminders: email sending is disabled");
            return;
        }
        try {
            ReminderRunResponse result = reminderService.runReminders();
            log.info("Daily reminders sent: {}", result.total());
        } catch (RuntimeException ex) {
            log.error("Daily reminders failed", ex);
        }
    }
}
