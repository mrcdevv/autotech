package com.autotech.invoice.dto;

import com.autotech.invoice.model.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceDetailResponse(
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
        InvoiceStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        List<InvoiceServiceItemResponse> services,
        List<InvoiceProductResponse> products,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
