package com.autotech.tax.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TaxConfigResponse(
        Long id,
        BigDecimal taxPercentage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
