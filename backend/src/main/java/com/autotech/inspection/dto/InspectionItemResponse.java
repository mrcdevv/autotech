package com.autotech.inspection.dto;

import com.autotech.inspection.model.InspectionItemStatus;

public record InspectionItemResponse(
        Long id,
        Long templateItemId,
        String templateItemName,
        InspectionItemStatus status,
        String comment
) {}
