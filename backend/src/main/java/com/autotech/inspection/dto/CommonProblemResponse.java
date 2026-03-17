package com.autotech.inspection.dto;

import java.time.LocalDateTime;

public record CommonProblemResponse(
        Long id,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
