package com.autotech.dashboard.dto;

import java.math.BigDecimal;

public record MonthlyRevenueResponse(
        Integer year,
        Integer month,
        BigDecimal total
) {}
