package com.autotech.dashboard.dto;

import java.math.BigDecimal;

public record ServiceRevenueResponse(
        String serviceName,
        BigDecimal totalRevenue
) {}
