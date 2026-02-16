package com.autotech.catalog.dto;

import java.time.LocalDateTime;

public record CannedJobResponse(
        Long id,
        String title,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
