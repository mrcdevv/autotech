package com.autotech.appointment.dto;

import com.autotech.appointment.model.AppointmentConfirmationStatus;
import com.autotech.appointment.model.AppointmentStatus;

import java.time.LocalDateTime;

/**
 * Minimal appointment data shown on the public confirmation page (no login).
 */
public record PublicAppointmentResponse(
        String clientFirstName,
        String vehicleDescription,
        String purpose,
        LocalDateTime startTime,
        LocalDateTime endTime,
        AppointmentStatus status,
        AppointmentConfirmationStatus confirmationStatus,
        boolean canRespond
) {}
