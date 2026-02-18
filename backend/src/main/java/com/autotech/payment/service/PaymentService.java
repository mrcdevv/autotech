package com.autotech.payment.service;

import com.autotech.payment.dto.PaymentRequest;
import com.autotech.payment.dto.PaymentResponse;
import com.autotech.payment.dto.PaymentSummaryResponse;

import java.util.List;

public interface PaymentService {

    List<PaymentResponse> getByInvoiceId(Long invoiceId);

    PaymentResponse getById(Long paymentId);

    PaymentSummaryResponse getSummary(Long invoiceId);

    PaymentResponse create(Long invoiceId, PaymentRequest request);

    PaymentResponse update(Long paymentId, PaymentRequest request);

    void delete(Long paymentId, Long performedByEmployeeId);
}
