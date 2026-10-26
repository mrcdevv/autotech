package com.autotech.notification.model;

import com.autotech.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notification_config")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class NotificationConfig extends BaseEntity {

    @Column(name = "reminders_enabled", nullable = false)
    @Builder.Default
    private Boolean remindersEnabled = true;

    @Column(name = "appointment_reminder_enabled", nullable = false)
    @Builder.Default
    private Boolean appointmentReminderEnabled = true;

    @Column(name = "service_reminder_enabled", nullable = false)
    @Builder.Default
    private Boolean serviceReminderEnabled = true;

    @Column(name = "service_reminder_months", nullable = false)
    @Builder.Default
    private Integer serviceReminderMonths = 6;

    @Column(name = "balance_due_enabled", nullable = false)
    @Builder.Default
    private Boolean balanceDueEnabled = true;

    @Column(name = "balance_due_days", nullable = false)
    @Builder.Default
    private Integer balanceDueDays = 7;

    @Column(name = "pickup_reminder_enabled", nullable = false)
    @Builder.Default
    private Boolean pickupReminderEnabled = true;

    @Column(name = "pickup_reminder_days", nullable = false)
    @Builder.Default
    private Integer pickupReminderDays = 3;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof NotificationConfig other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
