package com.autotech.estimate.dto;

import com.autotech.estimate.model.EstimateStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record EstimateDetailResponse(
        Long id,
        Long clientId,
        String clientFullName,
        String clientDni,
        String clientPhone,
        String clientEmail,
        Long vehicleId,
        String vehiclePlate,
        String vehicleBrand,
        String vehicleModel,
        Integer vehicleYear,
        Long repairOrderId,
        String mechanicNotes,
        List<InspectionIssueResponse> inspectionIssues,
        EstimateStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        List<EstimateServiceItemResponse> services,
        List<EstimateProductResponse> products,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
