package com.autotech.catalog.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CannedJobDetailResponse(
        Long id,
        String title,
        String description,
        List<CannedJobServiceResponse> services,
        List<CannedJobProductResponse> products,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
