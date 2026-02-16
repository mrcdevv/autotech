package com.autotech.inspection.dto;

import java.util.List;

public record InspectionGroupWithItemsResponse(
        Long groupId,
        String groupTitle,
        Integer sortOrder,
        List<InspectionItemResponse> items
) {}
