package com.autotech.dashboard.dto;

public record ReadyForPickupResponse(
        Long repairOrderId,
        String title,
        String clientFullName,
        String clientPhone,
        String vehiclePlate
) {}
