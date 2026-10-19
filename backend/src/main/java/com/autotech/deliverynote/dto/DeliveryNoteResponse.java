package com.autotech.deliverynote.dto;

import com.autotech.deliverynote.model.DeliveryNoteStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DeliveryNoteResponse(
        Long id,
        Long number,
        Long clientId,
        String clientFullName,
        Long vehicleId,
        String vehiclePlate,
        String vehicleModel,
        Long repairOrderId,
        Long estimateId,
        DeliveryNoteStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
