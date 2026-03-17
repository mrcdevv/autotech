package com.autotech.tag.dto;

import java.time.LocalDateTime;

public record TagResponse(
        Long id,
        String name,
        String color,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
