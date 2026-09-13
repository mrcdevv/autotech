package com.autotech.appointment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record CalendarConfigRequest(

        @NotNull(message = "La duración por defecto es obligatoria")
        @Min(value = 1, message = "La duración mínima es 1 minuto")
        Integer defaultAppointmentDurationMinutes,

        LocalTime startTime,

        LocalTime endTime
) {}
