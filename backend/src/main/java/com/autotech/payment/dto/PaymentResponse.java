package com.autotech.payment.dto;

import com.autotech.payment.model.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long invoiceId,
        LocalDate paymentDate,
        LocalDateTime createdAt,
        BigDecimal amount,
        String payerName,
        PaymentType paymentType,
        Long bankAccountId,
        String bankAccountAlias,
        String bankName,
        Long registeredByEmployeeId,
        String registeredByEmployeeFullName
) {}
