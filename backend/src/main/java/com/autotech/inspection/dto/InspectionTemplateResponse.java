package com.autotech.inspection.dto;

import java.time.LocalDateTime;
import java.util.List;

public record InspectionTemplateResponse(
        Long id,
        String title,
        List<InspectionTemplateGroupResponse> groups,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
