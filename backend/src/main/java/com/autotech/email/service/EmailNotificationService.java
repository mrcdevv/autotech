package com.autotech.email.service;

import com.autotech.appointment.model.Appointment;
import com.autotech.deliverynote.dto.DeliveryNoteDetailResponse;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.employee.model.Employee;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.payment.dto.PaymentSummaryResponse;
import com.autotech.payment.model.Payment;
import com.autotech.repairorder.model.RepairOrder;

import java.time.LocalDateTime;

public interface EmailNotificationService {

    void notifyEmployeeCreated(Employee employee, String temporaryPassword);

    void notifyPasswordReset(Employee employee, String temporaryPassword);

    void notifyPasswordRecovery(Employee employee, String resetUrl, int expiresMinutes);

    void notifyEstimateCreated(EstimateDetailResponse estimate, String approvalPageUrl, int linkValidDays);

    void notifyEstimateStatusChanged(EstimateDetailResponse estimate);

    void notifyDeliveryNoteCreated(DeliveryNoteDetailResponse deliveryNote);

    void notifyPaymentRegistered(Payment payment, PaymentSummaryResponse summary);

    void notifyVehicleReceived(RepairOrder order);

    void notifyVehicleReadyForPickup(RepairOrder order);

    void notifyAppointmentScheduled(Appointment appointment);

    void notifyAppointmentRescheduled(Appointment appointment, LocalDateTime previousStart, LocalDateTime previousEnd);

    void notifyAppointmentCancelled(Appointment appointment);

    // --- Scheduled reminders (include the unsubscribe link) ---

    void sendAppointmentReminder(Appointment appointment);

    void sendServiceReminder(RepairOrder lastDeliveredOrder, int monthsSinceService);

    void sendBalanceDueReminder(DeliveryNote deliveryNote, PaymentSummaryResponse summary);

    void sendPickupReminder(RepairOrder order, long daysWaiting);

    /**
     * Sends a test email synchronously; any SMTP failure is reported as a BusinessException.
     */
    void sendTestEmail(String to);
}
