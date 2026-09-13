package com.autotech.email.service;

import com.autotech.employee.model.Employee;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.payment.model.Payment;
import com.autotech.repairorder.model.RepairOrder;

public interface EmailNotificationService {

    void notifyEmployeeCreated(Employee employee, String temporaryPassword);

    void notifyPasswordReset(Employee employee, String temporaryPassword);

    void notifyPasswordRecovery(Employee employee, String temporaryPassword);

    void notifyEstimateCreated(EstimateDetailResponse estimate);

    void notifyEstimateStatusChanged(EstimateDetailResponse estimate);

    void notifyInvoiceCreated(InvoiceDetailResponse invoice);

    void notifyPaymentRegistered(Payment payment);

    void notifyVehicleReadyForPickup(RepairOrder order);
}
