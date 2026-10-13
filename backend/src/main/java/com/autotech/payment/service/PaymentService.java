package com.autotech.payment.service;

import com.autotech.payment.dto.PaymentRequest;
import com.autotech.payment.dto.PaymentResponse;
import com.autotech.payment.dto.PaymentSummaryResponse;

import java.util.List;

public interface PaymentService {

    List<PaymentResponse> getByDeliveryNoteId(Long deliveryNoteId);

    PaymentResponse getById(Long paymentId);

    PaymentSummaryResponse getSummary(Long deliveryNoteId);

    PaymentResponse create(Long deliveryNoteId, PaymentRequest request);

    PaymentResponse update(Long paymentId, PaymentRequest request);

    void delete(Long paymentId, Long performedByEmployeeId);
}
