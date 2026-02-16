package com.autotech.catalog.dto;

import java.math.BigDecimal;

public record CannedJobProductResponse(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice
) {}
