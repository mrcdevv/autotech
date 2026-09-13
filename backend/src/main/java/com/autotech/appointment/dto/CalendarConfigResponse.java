package com.autotech.appointment.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

public record CalendarConfigResponse(
        Long id,
        Integer defaultAppointmentDurationMinutes,
        LocalTime startTime,
        LocalTime endTime,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
