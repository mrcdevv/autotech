package com.autotech.estimate.dto;

import java.math.BigDecimal;

public record EstimateProductResponse(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}
