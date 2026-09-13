package com.autotech.estimate.dto;

import com.autotech.estimate.model.EstimateStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EstimateResponse(
        Long id,
        Long clientId,
        String clientFullName,
        Long vehicleId,
        String vehiclePlate,
        String vehicleModel,
        Long repairOrderId,
        EstimateStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
