package com.autotech.dashboard.dto;

import java.math.BigDecimal;

public record DebtAgingResponse(
        String range,
        Long invoiceCount,
        BigDecimal totalAmount
) {}
