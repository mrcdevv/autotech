package com.autotech.repairorder.dto;

import com.autotech.repairorder.model.RepairOrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record RepairOrderResponse(
        Long id,
        String title,
        RepairOrderStatus status,
        Long clientId,
        String clientFirstName,
        String clientLastName,
        String clientPhone,
        Long vehicleId,
        String vehiclePlate,
        String vehicleBrandName,
        String vehicleModel,
        Integer vehicleYear,
        List<EmployeeSummary> employees,
        List<TagResponse> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public record EmployeeSummary(
            Long id,
            String firstName,
            String lastName
    ) {}

    public record TagResponse(
            Long id,
            String name,
            String color
    ) {}
}
