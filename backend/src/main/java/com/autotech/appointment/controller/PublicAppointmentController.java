package com.autotech.appointment.controller;

import com.autotech.appointment.dto.PublicAppointmentResponse;
import com.autotech.appointment.service.AppointmentService;
import com.autotech.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints behind the personal link emailed to the client. No authentication: the token is the credential.
 */
@RestController
@RequestMapping("/api/public/appointments")
@RequiredArgsConstructor
public class PublicAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<PublicAppointmentResponse>> getByToken(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getByConfirmationToken(token)));
    }

    @PostMapping("/{token}/confirm")
    public ResponseEntity<ApiResponse<PublicAppointmentResponse>> confirm(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success("¡Gracias! Confirmaste tu turno",
                appointmentService.confirmByToken(token)));
    }

    @PostMapping("/{token}/decline")
    public ResponseEntity<ApiResponse<PublicAppointmentResponse>> decline(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success("Avisamos al taller que no podés asistir",
                appointmentService.declineByToken(token)));
    }
}
