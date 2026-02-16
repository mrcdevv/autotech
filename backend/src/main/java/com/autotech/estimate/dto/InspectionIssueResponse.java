package com.autotech.estimate.dto;

public record InspectionIssueResponse(
        Long inspectionItemId,
        String itemName,
        String status,
        String comment
) {}
