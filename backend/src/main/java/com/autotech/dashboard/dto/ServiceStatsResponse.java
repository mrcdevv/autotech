package com.autotech.dashboard.dto;

import java.math.BigDecimal;

public record ServiceStatsResponse(
        String serviceName,
        long count,
        BigDecimal totalRevenue
) {}
