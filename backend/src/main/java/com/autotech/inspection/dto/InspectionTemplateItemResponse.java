package com.autotech.inspection.dto;

public record InspectionTemplateItemResponse(
        Long id,
        String name,
        Integer sortOrder
) {}
