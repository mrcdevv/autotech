package com.autotech.dashboard.dto;

import java.math.BigDecimal;

public record PendingEstimateAlertResponse(
        Long estimateId,
        String clientFullName,
        String vehiclePlate,
        BigDecimal total,
        Long daysPending
) {}
