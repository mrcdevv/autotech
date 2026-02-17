package com.autotech.dashboard.dto;

import java.time.LocalDateTime;

public record TodayAppointmentResponse(
        Long appointmentId,
        LocalDateTime startTime,
        String clientFullName,
        String vehiclePlate,
        String purpose
) {}
