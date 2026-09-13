package com.autotech.estimate.dto;

import java.math.BigDecimal;

public record EstimateServiceItemResponse(
        Long id,
        String serviceName,
        BigDecimal price
) {}
