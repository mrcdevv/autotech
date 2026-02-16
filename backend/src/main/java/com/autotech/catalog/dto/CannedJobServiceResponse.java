package com.autotech.catalog.dto;

import java.math.BigDecimal;

public record CannedJobServiceResponse(
        Long id,
        String serviceName,
        BigDecimal price
) {}
