package com.autotech.repairorder.dto;

import com.autotech.repairorder.model.RepairOrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record RepairOrderDetailResponse(
        Long id,
        String title,
        RepairOrderStatus status,
        String reason,
        String clientSource,
        String mechanicNotes,
        Long appointmentId,
        Long clientId,
        String clientFirstName,
        String clientLastName,
        String clientDni,
        String clientPhone,
        String clientEmail,
        Long vehicleId,
        String vehiclePlate,
        String vehicleBrandName,
        String vehicleModel,
        Integer vehicleYear,
        String vehicleChassisNumber,
        List<RepairOrderResponse.EmployeeSummary> employees,
        List<RepairOrderResponse.TagResponse> tags,
        List<WorkHistoryEntry> workHistory,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public record WorkHistoryEntry(
            Long repairOrderId,
            String repairOrderTitle,
            String reason,
            LocalDateTime createdAt
    ) {}
}
