package com.autotech.appointment.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AppointmentUpdateRequest(

        @NotNull(message = "La fecha y hora de inicio es obligatoria")
        LocalDateTime startTime,

        @NotNull(message = "La fecha y hora de fin es obligatoria")
        LocalDateTime endTime
) {}
