package com.autotech.dashboard.dto;

public record MechanicProductivityResponse(
        Long employeeId,
        String employeeFullName,
        Long completedOrders
) {}
