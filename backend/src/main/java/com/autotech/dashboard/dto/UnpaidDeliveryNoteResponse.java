package com.autotech.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UnpaidDeliveryNoteResponse(
        Long deliveryNoteId,
        String clientFullName,
        String vehiclePlate,
        BigDecimal total,
        LocalDateTime createdAt
) {}
