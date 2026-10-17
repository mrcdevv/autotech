package com.autotech.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "autotech.notifications")
public class NotificationProperties {

    /** Spring cron (sec min hour day month weekday) of the daily reminders job, in the workshop time zone. */
    private String remindersCron = "0 0 9 * * *";

    public String getRemindersCron() {
        return remindersCron;
    }

    public void setRemindersCron(String remindersCron) {
        this.remindersCron = remindersCron;
    }
}
