package com.autotech.appointment.dto;

import com.autotech.appointment.model.VehicleDeliveryMethod;

import java.time.LocalDateTime;
import java.util.List;

public record AppointmentResponse(
        Long id,
        String title,
        Long clientId,
        String clientFullName,
        Long vehicleId,
        String vehiclePlate,
        String vehicleBrand,
        String vehicleModel,
        String purpose,
        LocalDateTime startTime,
        LocalDateTime endTime,
        VehicleDeliveryMethod vehicleDeliveryMethod,
        LocalDateTime vehicleArrivedAt,
        LocalDateTime vehiclePickedUpAt,
        Boolean clientArrived,
        List<EmployeeSummaryResponse> employees,
        List<AppointmentTagResponse> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
