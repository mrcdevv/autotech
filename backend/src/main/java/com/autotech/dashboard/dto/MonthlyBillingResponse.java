package com.autotech.dashboard.dto;

import java.math.BigDecimal;

public record MonthlyBillingResponse(
        int year,
        int month,
        BigDecimal billed,
        BigDecimal collected
) {}
