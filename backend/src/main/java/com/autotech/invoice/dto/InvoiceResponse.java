package com.autotech.invoice.dto;

import com.autotech.invoice.model.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InvoiceResponse(
        Long id,
        Long clientId,
        String clientFullName,
        Long vehicleId,
        String vehiclePlate,
        String vehicleModel,
        Long repairOrderId,
        Long estimateId,
        InvoiceStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
