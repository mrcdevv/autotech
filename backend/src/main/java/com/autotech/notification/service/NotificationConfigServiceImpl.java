package com.autotech.notification.service;

import com.autotech.email.service.EmailService;
import com.autotech.notification.config.NotificationProperties;
import com.autotech.notification.dto.NotificationConfigRequest;
import com.autotech.notification.dto.NotificationConfigResponse;
import com.autotech.notification.model.NotificationConfig;
import com.autotech.notification.repository.NotificationConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationConfigServiceImpl implements NotificationConfigService {

    private final NotificationConfigRepository notificationConfigRepository;
    private final EmailService emailService;
    private final NotificationProperties notificationProperties;

    @Override
    @Transactional
    public NotificationConfigResponse getConfig() {
        return toResponse(getCurrent());
    }

    @Override
    @Transactional
    public NotificationConfigResponse updateConfig(NotificationConfigRequest request) {
        NotificationConfig config = getCurrent();
        config.setRemindersEnabled(request.remindersEnabled());
        config.setAppointmentReminderEnabled(request.appointmentReminderEnabled());
        config.setServiceReminderEnabled(request.serviceReminderEnabled());
        config.setServiceReminderMonths(request.serviceReminderMonths());
        config.setBalanceDueEnabled(request.balanceDueEnabled());
        config.setBalanceDueDays(request.balanceDueDays());
        config.setPickupReminderEnabled(request.pickupReminderEnabled());
        config.setPickupReminderDays(request.pickupReminderDays());
        NotificationConfig saved = notificationConfigRepository.save(config);
        log.info("Updated notification settings");
        return toResponse(saved);
    }

    @Override
    @Transactional
    public NotificationConfig getCurrent() {
        return notificationConfigRepository.findAll().stream().findFirst()
                .orElseGet(() -> notificationConfigRepository.save(NotificationConfig.builder().build()));
    }

    private NotificationConfigResponse toResponse(NotificationConfig config) {
        return new NotificationConfigResponse(
                config.getRemindersEnabled(),
                config.getAppointmentReminderEnabled(),
                config.getServiceReminderEnabled(),
                config.getServiceReminderMonths(),
                config.getBalanceDueEnabled(),
                config.getBalanceDueDays(),
                config.getPickupReminderEnabled(),
                config.getPickupReminderDays(),
                emailService.isEnabled(),
                notificationProperties.getRemindersCron()
        );
    }
}
