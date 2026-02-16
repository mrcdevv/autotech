package com.autotech.catalog.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CatalogServiceResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
