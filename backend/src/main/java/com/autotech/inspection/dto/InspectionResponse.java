package com.autotech.inspection.dto;

import java.time.LocalDateTime;
import java.util.List;

public record InspectionResponse(
        Long id,
        Long repairOrderId,
        Long templateId,
        String templateTitle,
        List<InspectionGroupWithItemsResponse> groups,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
