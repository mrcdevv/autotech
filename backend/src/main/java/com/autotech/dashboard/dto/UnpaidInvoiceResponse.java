package com.autotech.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UnpaidInvoiceResponse(
        Long invoiceId,
        String clientFullName,
        String vehiclePlate,
        BigDecimal total,
        LocalDateTime createdAt
) {}
