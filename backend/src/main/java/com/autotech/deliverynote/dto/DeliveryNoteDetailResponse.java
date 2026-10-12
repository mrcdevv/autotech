package com.autotech.deliverynote.dto;

import com.autotech.deliverynote.model.DeliveryNoteStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record DeliveryNoteDetailResponse(
        Long id,
        Long clientId,
        String clientFullName,
        String clientDni,
        String clientPhone,
        String clientEmail,
        String clientType,
        Long vehicleId,
        String vehiclePlate,
        String vehicleBrand,
        String vehicleModel,
        Integer vehicleYear,
        Long repairOrderId,
        Long estimateId,
        DeliveryNoteStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        List<DeliveryNoteServiceItemResponse> services,
        List<DeliveryNoteProductResponse> products,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
