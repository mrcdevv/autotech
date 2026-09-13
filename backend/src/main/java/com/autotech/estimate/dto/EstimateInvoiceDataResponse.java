package com.autotech.estimate.dto;

import java.math.BigDecimal;
import java.util.List;

public record EstimateInvoiceDataResponse(
        Long estimateId,
        Long clientId,
        Long vehicleId,
        Long repairOrderId,
        List<EstimateServiceItemResponse> services,
        List<EstimateProductResponse> products,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total
) {}
