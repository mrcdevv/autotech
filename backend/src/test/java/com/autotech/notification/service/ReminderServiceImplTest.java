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
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReminderServiceImplTest {

    @Mock
    private NotificationConfigService notificationConfigService;

    @Mock
    private NotificationLogRepository notificationLogRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private DeliveryNoteRepository deliveryNoteRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private EmailService emailService;

    @Mock
    private AppProperties appProperties;

    @Mock
    private PlatformTransactionManager transactionManager;

    private ReminderServiceImpl reminderService;

    private final LocalDateTime now = LocalDateTime.of(2026, 10, 17, 9, 0);

    @BeforeEach
    void setUp() {
        reminderService = new ReminderServiceImpl(notificationConfigService, notificationLogRepository,
                appointmentRepository, repairOrderRepository, deliveryNoteRepository, paymentService,
                emailNotificationService, emailService, appProperties, transactionManager);
        when(transactionManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        when(emailService.isEnabled()).thenReturn(true);
        when(appProperties.workshopNow()).thenReturn(now);
        when(notificationConfigService.getCurrent()).thenReturn(NotificationConfig.builder().build());
    }

    @Test
    void givenMailDisabled_whenRunReminders_thenThrowBusinessException() {
        // Arrange
        when(emailService.isEnabled()).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> reminderService.runReminders())
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deshabilitado");
    }

    @Test
    void givenRemindersDisabled_whenRunReminders_thenSendNothing() {
        // Arrange
        when(notificationConfigService.getCurrent())
                .thenReturn(NotificationConfig.builder().remindersEnabled(false).build());

        // Act
        ReminderRunResponse result = reminderService.runReminders();

        // Assert
        assertThat(result.total()).isZero();
        verify(appointmentRepository, never()).findScheduledStartingBetween(any(), any());
    }

    @Test
    void givenTomorrowAppointments_whenRunReminders_thenRemindOnlyEligibleClientsAndLogThem() {
        // Arrange
        Appointment eligible = appointment(1L, client("ana@test.com", false), AppointmentConfirmationStatus.PENDING);
        Appointment declined = appointment(2L, client("beto@test.com", false), AppointmentConfirmationStatus.DECLINED);
        Appointment optedOut = appointment(3L, client("caro@test.com", true), AppointmentConfirmationStatus.CONFIRMED);
        Appointment noEmail = appointment(4L, client(null, false), AppointmentConfirmationStatus.PENDING);
        Appointment alreadySent = appointment(5L, client("dani@test.com", false), AppointmentConfirmationStatus.CONFIRMED);
        when(appointmentRepository.findScheduledStartingBetween(
                LocalDateTime.of(2026, 10, 18, 0, 0), LocalDateTime.of(2026, 10, 19, 0, 0)))
                .thenReturn(List.of(eligible, declined, optedOut, noEmail, alreadySent));
        when(notificationLogRepository.existsByTypeAndReferenceId(NotificationType.APPOINTMENT_REMINDER, 5L)).thenReturn(true);

        // Act
        ReminderRunResponse result = reminderService.runReminders();

        // Assert
        assertThat(result.appointmentReminders()).isEqualTo(1);
        verify(emailNotificationService).sendAppointmentReminder(eligible);
        verify(emailNotificationService, never()).sendAppointmentReminder(declined);
        verify(emailNotificationService, never()).sendAppointmentReminder(optedOut);
        verify(emailNotificationService, never()).sendAppointmentReminder(noEmail);
        verify(emailNotificationService, never()).sendAppointmentReminder(alreadySent);
        ArgumentCaptor<NotificationLog> logCaptor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(notificationLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getType()).isEqualTo(NotificationType.APPOINTMENT_REMINDER);
        assertThat(logCaptor.getValue().getReferenceId()).isEqualTo(1L);
        assertThat(logCaptor.getValue().getRecipient()).isEqualTo("ana@test.com");
    }

    @Test
    void givenEmailRenderingFails_whenRunReminders_thenDoNotLogAndContinue() {
        // Arrange
        Appointment failing = appointment(1L, client("ana@test.com", false), AppointmentConfirmationStatus.PENDING);
        when(appointmentRepository.findScheduledStartingBetween(any(), any())).thenReturn(List.of(failing));
        org.mockito.Mockito.doThrow(new IllegalStateException("template error"))
                .when(emailNotificationService).sendAppointmentReminder(failing);

        // Act
        ReminderRunResponse result = reminderService.runReminders();

        // Assert
        assertThat(result.appointmentReminders()).isZero();
        verify(notificationLogRepository, never()).save(any());
    }

    @Test
    void givenUnpaidAndPaidDeliveryNotes_whenRunReminders_thenRemindOnlyWithRemainingBalance() {
        // Arrange
        DeliveryNote unpaid = deliveryNote(10L, client("ana@test.com", false));
        DeliveryNote settled = deliveryNote(11L, client("beto@test.com", false));
        when(deliveryNoteRepository.findByStatusCreatedBefore(eq(DeliveryNoteStatus.PENDIENTE), any()))
                .thenReturn(List.of(unpaid, settled));
        PaymentSummaryResponse withBalance = summary(BigDecimal.valueOf(1000), BigDecimal.valueOf(400));
        when(paymentService.getSummary(10L)).thenReturn(withBalance);
        when(paymentService.getSummary(11L)).thenReturn(summary(BigDecimal.valueOf(500), BigDecimal.valueOf(500)));

        // Act
        ReminderRunResponse result = reminderService.runReminders();

        // Assert
        assertThat(result.balanceDueReminders()).isEqualTo(1);
        verify(emailNotificationService).sendBalanceDueReminder(unpaid, withBalance);
        verify(emailNotificationService, never()).sendBalanceDueReminder(eq(settled), any());
    }

    @Test
    void givenOrderReadyFiveDaysAgo_whenRunReminders_thenSendPickupReminderWithDaysWaiting() {
        // Arrange
        RepairOrder ready = RepairOrder.builder().client(client("ana@test.com", false))
                .status(RepairOrderStatus.LISTO_PARA_ENTREGAR)
                .readyForPickupAt(LocalDateTime.now().minusDays(5).minusHours(1)).build();
        ready.setId(20L);
        when(repairOrderRepository.findReadyForPickupBefore(any())).thenReturn(List.of(ready));

        // Act
        ReminderRunResponse result = reminderService.runReminders();

        // Assert
        assertThat(result.pickupReminders()).isEqualTo(1);
        verify(emailNotificationService).sendPickupReminder(ready, 5L);
    }

    @Test
    void givenServiceReminderDisabled_whenRunReminders_thenDoNotQueryDeliveredOrders() {
        // Arrange
        when(notificationConfigService.getCurrent())
                .thenReturn(NotificationConfig.builder().serviceReminderEnabled(false).build());

        // Act
        reminderService.runReminders();

        // Assert
        verify(repairOrderRepository, never()).findLatestDeliveredBefore(any());
    }

    @Test
    void givenDeliveredOrderOlderThanThreshold_whenRunReminders_thenSendServiceReminder() {
        // Arrange
        when(notificationConfigService.getCurrent())
                .thenReturn(NotificationConfig.builder().serviceReminderMonths(6).build());
        RepairOrder delivered = RepairOrder.builder().client(client("ana@test.com", false))
                .status(RepairOrderStatus.ENTREGADO).deliveredAt(LocalDateTime.now().minusMonths(7)).build();
        delivered.setId(30L);
        when(repairOrderRepository.findLatestDeliveredBefore(any())).thenReturn(List.of(delivered));

        // Act
        ReminderRunResponse result = reminderService.runReminders();

        // Assert
        assertThat(result.serviceReminders()).isEqualTo(1);
        verify(emailNotificationService).sendServiceReminder(delivered, 6);
        verify(notificationLogRepository).existsByTypeAndReferenceId(NotificationType.SERVICE_REMINDER, 30L);
    }

    private Client client(String email, boolean optOut) {
        Client client = Client.builder().firstName("Cliente").lastName("Test").phone("1").email(email)
                .emailOptOut(optOut).build();
        client.setId(anyIdFor(email));
        return client;
    }

    private long anyIdFor(String email) {
        return email == null ? 99L : Math.abs(email.hashCode());
    }

    private Appointment appointment(Long id, Client client, AppointmentConfirmationStatus confirmation) {
        Appointment appointment = Appointment.builder().client(client)
                .startTime(LocalDateTime.of(2026, 10, 18, 9, 0)).endTime(LocalDateTime.of(2026, 10, 18, 10, 0))
                .confirmationStatus(confirmation).build();
        appointment.setId(id);
        return appointment;
    }

    private DeliveryNote deliveryNote(Long id, Client client) {
        DeliveryNote deliveryNote = DeliveryNote.builder().client(client).number(id).status(DeliveryNoteStatus.PENDIENTE).build();
        deliveryNote.setId(id);
        return deliveryNote;
    }

    private PaymentSummaryResponse summary(BigDecimal total, BigDecimal paid) {
        return new PaymentSummaryResponse(total, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, total, paid, total.subtract(paid));
    }
}
