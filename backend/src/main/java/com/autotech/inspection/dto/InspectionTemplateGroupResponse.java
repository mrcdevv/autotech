package com.autotech.inspection.dto;

import java.util.List;

public record InspectionTemplateGroupResponse(
        Long id,
        String title,
        Integer sortOrder,
        List<InspectionTemplateItemResponse> items
) {}
