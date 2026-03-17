package com.autotech.payment.dto;

import com.autotech.payment.model.Payment;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment entity) {
        if (entity == null) return null;
        return new PaymentResponse(
                entity.getId(),
                entity.getInvoice().getId(),
                entity.getPaymentDate(),
                entity.getCreatedAt(),
                entity.getAmount(),
                entity.getPayerName(),
                entity.getPaymentType(),
                entity.getBankAccount() != null ? entity.getBankAccount().getId() : null,
                entity.getBankAccount() != null ? entity.getBankAccount().getAlias() : null,
                entity.getBankAccount() != null ? entity.getBankAccount().getBank().getName() : null,
                entity.getRegisteredByEmployee() != null ? entity.getRegisteredByEmployee().getId() : null,
                entity.getRegisteredByEmployee() != null
                        ? entity.getRegisteredByEmployee().getFirstName() + " " + entity.getRegisteredByEmployee().getLastName()
                        : null
        );
    }

    public Payment toEntity(PaymentRequest request) {
        if (request == null) return null;
        return Payment.builder()
                .paymentDate(request.paymentDate())
                .amount(request.amount())
                .payerName(request.payerName())
                .paymentType(request.paymentType())
                .build();
    }

    public List<PaymentResponse> toResponseList(List<Payment> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }
}
