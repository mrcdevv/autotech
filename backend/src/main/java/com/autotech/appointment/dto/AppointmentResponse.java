package com.autotech.appointment.dto;

import com.autotech.appointment.model.AppointmentConfirmationStatus;
import com.autotech.appointment.model.AppointmentStatus;
import com.autotech.appointment.model.VehicleDeliveryMethod;

import java.time.LocalDateTime;
import java.util.List;

public record AppointmentResponse(
        Long id,
        String title,
        Long clientId,
        String clientFullName,
        String clientEmail,
        Long vehicleId,
        String vehiclePlate,
        String vehicleBrand,
        String vehicleModel,
        String purpose,
        LocalDateTime startTime,
        LocalDateTime endTime,
        VehicleDeliveryMethod vehicleDeliveryMethod,
        AppointmentStatus status,
        LocalDateTime vehicleArrivedAt,
        LocalDateTime vehiclePickedUpAt,
        Boolean clientArrived,
        AppointmentConfirmationStatus confirmationStatus,
        LocalDateTime confirmedAt,
        List<EmployeeSummaryResponse> employees,
        List<AppointmentTagResponse> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
