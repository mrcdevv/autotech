package com.autotech.dashboard.dto;

public record StaleOrderAlertResponse(
        Long repairOrderId,
        String title,
        String clientFullName,
        String vehiclePlate,
        String status,
        Long daysSinceLastUpdate
) {}
