package com.autotech.vehicle.dto;

import java.time.LocalDateTime;

public record BrandResponse(
        Long id,
        String name,
        LocalDateTime createdAt
) {}
