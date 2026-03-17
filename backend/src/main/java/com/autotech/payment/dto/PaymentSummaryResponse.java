package com.autotech.payment.dto;

import java.math.BigDecimal;

public record PaymentSummaryResponse(
        BigDecimal totalServices,
        BigDecimal totalProducts,
        BigDecimal taxAmount,
        BigDecimal discountAmount,
        BigDecimal total,
        BigDecimal totalPaid,
        BigDecimal remaining
) {}
