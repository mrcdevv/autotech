package com.autotech.estimate.dto;

import com.autotech.estimate.model.EstimateDecisionChannel;
import com.autotech.estimate.model.EstimateStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Estimate data shown on the public approval page (no login). No internal ids or contact data.
 */
public record PublicEstimateResponse(
        Long estimateNumber,
        String clientFirstName,
        String vehicleDescription,
        List<EstimateServiceItemResponse> services,
        List<EstimateProductResponse> products,
        List<InspectionIssueResponse> inspectionIssues,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        EstimateStatus status,
        EstimateDecisionChannel decisionChannel,
        LocalDateTime decidedAt,
        LocalDateTime expiresAt,
        boolean canDecide
) {}
