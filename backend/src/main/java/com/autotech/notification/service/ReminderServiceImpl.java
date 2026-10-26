package com.autotech.notification.service;

import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.model.AppointmentConfirmationStatus;
import com.autotech.appointment.repository.AppointmentRepository;
import com.autotech.client.model.Client;
import com.autotech.common.exception.BusinessException;
import com.autotech.config.AppProperties;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import com.autotech.deliverynote.repository.DeliveryNoteRepository;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.email.service.EmailService;
import com.autotech.notification.dto.ReminderRunResponse;
import com.autotech.notification.model.NotificationConfig;
import com.autotech.notification.model.NotificationLog;
import com.autotech.notification.model.NotificationType;
import com.autotech.notification.repository.NotificationLogRepository;
import com.autotech.payment.dto.PaymentSummaryResponse;
import com.autotech.payment.service.PaymentService;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.repository.RepairOrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.function.Supplier;

@Slf4j
@Service
public class ReminderServiceImpl implements ReminderService {

    private final NotificationConfigService notificationConfigService;
    private final NotificationLogRepository notificationLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final DeliveryNoteRepository deliveryNoteRepository;
    private final PaymentService paymentService;
    private final EmailNotificationService emailNotificationService;
    private final EmailService emailService;
    private final AppProperties appProperties;
    private final TransactionTemplate transactionTemplate;

    public ReminderServiceImpl(NotificationConfigService notificationConfigService,
                               NotificationLogRepository notificationLogRepository,
                               AppointmentRepository appointmentRepository,
                               RepairOrderRepository repairOrderRepository,
                               DeliveryNoteRepository deliveryNoteRepository,
                               PaymentService paymentService,
                               EmailNotificationService emailNotificationService,
                               EmailService emailService,
                               AppProperties appProperties,
                               PlatformTransactionManager transactionManager) {
        this.notificationConfigService = notificationConfigService;
        this.notificationLogRepository = notificationLogRepository;
        this.appointmentRepository = appointmentRepository;
        this.repairOrderRepository = repairOrderRepository;
        this.deliveryNoteRepository = deliveryNoteRepository;
        this.paymentService = paymentService;
        this.emailNotificationService = emailNotificationService;
        this.emailService = emailService;
        this.appProperties = appProperties;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Override
    public ReminderRunResponse runReminders() {
        if (!emailService.isEnabled()) {
            throw new BusinessException("El envío de emails está deshabilitado (AUTOTECH_MAIL_ENABLED=false)");
        }
        NotificationConfig config = notificationConfigService.getCurrent();
        if (!Boolean.TRUE.equals(config.getRemindersEnabled())) {
            log.info("Reminders are disabled in the notification settings");
            return ReminderRunResponse.none();
        }

        // One transaction per reminder type: emails are dispatched after each commit
        int appointments = Boolean.TRUE.equals(config.getAppointmentReminderEnabled())
                ? inTransaction(this::sendAppointmentReminders) : 0;
        int services = Boolean.TRUE.equals(config.getServiceReminderEnabled())
                ? inTransaction(() -> sendServiceReminders(config.getServiceReminderMonths())) : 0;
        int balances = Boolean.TRUE.equals(config.getBalanceDueEnabled())
                ? inTransaction(() -> sendBalanceDueReminders(config.getBalanceDueDays())) : 0;
        int pickups = Boolean.TRUE.equals(config.getPickupReminderEnabled())
                ? inTransaction(() -> sendPickupReminders(config.getPickupReminderDays())) : 0;

        ReminderRunResponse result = new ReminderRunResponse(appointments, services, balances, pickups);
        log.info("Reminders run finished: {} appointment, {} service, {} balance due, {} pickup",
                appointments, services, balances, pickups);
        return result;
    }

    int sendAppointmentReminders() {
        LocalDate tomorrow = appProperties.workshopNow().toLocalDate().plusDays(1);
        int sent = 0;
        for (Appointment appointment : appointmentRepository.findScheduledStartingBetween(
                tomorrow.atStartOfDay(), tomorrow.plusDays(1).atStartOfDay())) {
            if (appointment.getConfirmationStatus() == AppointmentConfirmationStatus.DECLINED) {
                continue;
            }
            if (trySend(NotificationType.APPOINTMENT_REMINDER, appointment.getId(), appointment.getClient(),
                    () -> emailNotificationService.sendAppointmentReminder(appointment))) {
                sent++;
            }
        }
        return sent;
    }

    int sendServiceReminders(int months) {
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(months);
        int sent = 0;
        for (RepairOrder order : repairOrderRepository.findLatestDeliveredBefore(cutoff)) {
            if (trySend(NotificationType.SERVICE_REMINDER, order.getId(), order.getClient(),
                    () -> emailNotificationService.sendServiceReminder(order, months))) {
                sent++;
            }
        }
        return sent;
    }

    int sendBalanceDueReminders(int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        int sent = 0;
        for (DeliveryNote deliveryNote : deliveryNoteRepository.findByStatusCreatedBefore(DeliveryNoteStatus.PENDIENTE, cutoff)) {
            if (notificationLogRepository.existsByTypeAndReferenceId(NotificationType.BALANCE_DUE, deliveryNote.getId())) {
                continue;
            }
            PaymentSummaryResponse summary = paymentService.getSummary(deliveryNote.getId());
            if (summary.remaining().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            if (trySend(NotificationType.BALANCE_DUE, deliveryNote.getId(), deliveryNote.getClient(),
                    () -> emailNotificationService.sendBalanceDueReminder(deliveryNote, summary))) {
                sent++;
            }
        }
        return sent;
    }

    int sendPickupReminders(int days) {
        LocalDateTime now = LocalDateTime.now();
        int sent = 0;
        for (RepairOrder order : repairOrderRepository.findReadyForPickupBefore(now.minusDays(days))) {
            long daysWaiting = ChronoUnit.DAYS.between(order.getReadyForPickupAt(), now);
            if (trySend(NotificationType.PICKUP_REMINDER, order.getId(), order.getClient(),
                    () -> emailNotificationService.sendPickupReminder(order, daysWaiting))) {
                sent++;
            }
        }
        return sent;
    }

    /**
     * Sends the reminder unless the client cannot receive it or it was already sent, then records it.
     */
    private boolean trySend(NotificationType type, Long referenceId, Client client, Runnable send) {
        if (client == null || client.getEmail() == null || client.getEmail().isBlank()
                || Boolean.TRUE.equals(client.getEmailOptOut())) {
            return false;
        }
        if (notificationLogRepository.existsByTypeAndReferenceId(type, referenceId)) {
            return false;
        }
        try {
            send.run();
        } catch (RuntimeException ex) {
            log.error("Could not prepare {} reminder for reference {}", type, referenceId, ex);
            return false;
        }
        notificationLogRepository.save(NotificationLog.builder()
                .type(type)
                .referenceId(referenceId)
                .recipient(client.getEmail())
                .build());
        return true;
    }

    private int inTransaction(Supplier<Integer> work) {
        Integer result = transactionTemplate.execute(status -> work.get());
        return result != null ? result : 0;
    }
}
