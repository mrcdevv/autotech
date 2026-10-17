package com.autotech.appointment.controller;

import com.autotech.appointment.dto.PublicAppointmentResponse;
import com.autotech.appointment.model.AppointmentConfirmationStatus;
import com.autotech.appointment.model.AppointmentStatus;
import com.autotech.appointment.service.AppointmentService;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.security.CustomUserDetailsService;
import com.autotech.security.JwtTokenProvider;
import com.autotech.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs with the real SecurityConfig and no authenticated user: the public endpoints must be reachable anonymously.
 */
@WebMvcTest(PublicAppointmentController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class PublicAppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppointmentService appointmentService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    private final PublicAppointmentResponse response = new PublicAppointmentResponse(
            "Martín", "Toyota Corolla (AB 123 CD)", "Service",
            LocalDateTime.of(2030, 10, 23, 9, 0), LocalDateTime.of(2030, 10, 23, 10, 0),
            AppointmentStatus.SCHEDULED, AppointmentConfirmationStatus.PENDING, true);

    @Test
    void givenAnonymousUser_whenGetByToken_thenReturn200() throws Exception {
        when(appointmentService.getByConfirmationToken("tok")).thenReturn(response);

        mockMvc.perform(get("/api/public/appointments/tok"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clientFirstName").value("Martín"))
                .andExpect(jsonPath("$.data.canRespond").value(true));
    }

    @Test
    void givenAnonymousUser_whenConfirm_thenReturn200() throws Exception {
        when(appointmentService.confirmByToken("tok")).thenReturn(response);

        mockMvc.perform(post("/api/public/appointments/tok/confirm"))
                .andExpect(status().isOk());
    }

    @Test
    void givenPastAppointment_whenDecline_thenReturn400() throws Exception {
        when(appointmentService.declineByToken("tok"))
                .thenThrow(new BusinessException("Este turno ya pasó y no se puede modificar"));

        mockMvc.perform(post("/api/public/appointments/tok/decline"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Este turno ya pasó y no se puede modificar"));
    }

    @Test
    void givenUnknownToken_whenGetByToken_thenReturn404() throws Exception {
        when(appointmentService.getByConfirmationToken("nope"))
                .thenThrow(new ResourceNotFoundException("El enlace del turno no es válido"));

        mockMvc.perform(get("/api/public/appointments/nope"))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenAnonymousUser_whenCallingPrivateEndpointPath_thenNotPermitted() throws Exception {
        mockMvc.perform(get("/api/appointments/1"))
                .andExpect(status().is4xxClientError());
    }
}
