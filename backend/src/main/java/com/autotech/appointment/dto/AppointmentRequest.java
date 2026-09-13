package com.autotech.appointment.dto;

import com.autotech.appointment.model.VehicleDeliveryMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public record AppointmentRequest(

        @Size(max = 255, message = "El título no puede superar los 255 caracteres")
        String title,

        Long clientId,

        Long vehicleId,

        @Size(max = 5000, message = "El propósito no puede superar los 5000 caracteres")
        String purpose,

        @NotNull(message = "La fecha y hora de inicio es obligatoria")
        LocalDateTime startTime,

        @NotNull(message = "La fecha y hora de fin es obligatoria")
        LocalDateTime endTime,

        VehicleDeliveryMethod vehicleDeliveryMethod,

        List<Long> employeeIds,

        List<Long> tagIds
) {}
