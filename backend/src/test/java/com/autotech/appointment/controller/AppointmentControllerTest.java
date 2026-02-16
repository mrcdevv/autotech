package com.autotech.appointment.controller;

import com.autotech.appointment.dto.AppointmentRequest;
import com.autotech.appointment.dto.AppointmentResponse;
import com.autotech.appointment.dto.AppointmentUpdateRequest;
import com.autotech.appointment.service.AppointmentService;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AppointmentController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AppointmentService appointmentService;

    private final LocalDateTime startTime = LocalDateTime.of(2025, 3, 15, 10, 0);
    private final LocalDateTime endTime = LocalDateTime.of(2025, 3, 15, 11, 0);

    private final AppointmentResponse sampleResponse = new AppointmentResponse(
            1L, "Test", null, null, null, null, null, null,
            "Purpose", startTime, endTime, null, null, null, false,
            List.of(), List.of(), null, null
    );

    @Test
    void givenAppointments_whenGetAll_thenReturn200() throws Exception {
        // Arrange
        when(appointmentService.getAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        // Act & Assert
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Test"));
    }

    @Test
    void givenExistingId_whenGetById_thenReturn200() throws Exception {
        // Arrange
        when(appointmentService.getById(1L)).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(get("/api/appointments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Test"));
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        // Arrange
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, "Purpose", startTime, endTime, null, null, null);
        when(appointmentService.create(any(AppointmentRequest.class))).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(post("/api/appointments").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Test"));
    }

    @Test
    void givenInvalidRequest_whenCreate_thenReturn400() throws Exception {
        // Arrange - missing startTime and endTime
        AppointmentRequest request = new AppointmentRequest(
                "Test", null, null, "Purpose", null, null, null, null, null);

        // Act & Assert
        mockMvc.perform(post("/api/appointments").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        // Arrange
        AppointmentUpdateRequest request = new AppointmentUpdateRequest(startTime, endTime);
        when(appointmentService.update(eq(1L), any(AppointmentUpdateRequest.class))).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(put("/api/appointments/1").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cita actualizada"));
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/appointments/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cita eliminada"));
    }

    @Test
    void givenAppointment_whenMarkClientArrived_thenReturn200() throws Exception {
        // Arrange
        when(appointmentService.markClientArrived(1L, true)).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(patch("/api/appointments/1/client-arrived").with(csrf())
                        .param("arrived", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cliente marcado como presente"));
    }

    @Test
    void givenAppointment_whenMarkVehicleArrived_thenReturn200() throws Exception {
        // Arrange
        when(appointmentService.markVehicleArrived(1L)).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(patch("/api/appointments/1/vehicle-arrived").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Vehículo marcado como recibido"));
    }

    @Test
    void givenAppointment_whenMarkVehiclePickedUp_thenReturn200() throws Exception {
        // Arrange
        when(appointmentService.markVehiclePickedUp(1L)).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(patch("/api/appointments/1/vehicle-picked-up").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Vehículo marcado como retirado"));
    }

    @Test
    void givenDateRange_whenGetByDateRange_thenReturn200() throws Exception {
        // Arrange
        when(appointmentService.getByDateRange(any(), any())).thenReturn(List.of(sampleResponse));

        // Act & Assert
        mockMvc.perform(get("/api/appointments/range")
                        .param("start", "2025-03-15T00:00:00")
                        .param("end", "2025-03-16T00:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Test"));
    }

    @Test
    void givenDateRangeWithEmployeeFilter_whenGetByDateRange_thenReturn200() throws Exception {
        // Arrange
        when(appointmentService.getByEmployeeAndDateRange(eq(1L), any(), any()))
                .thenReturn(List.of(sampleResponse));

        // Act & Assert
        mockMvc.perform(get("/api/appointments/range")
                        .param("start", "2025-03-15T00:00:00")
                        .param("end", "2025-03-16T00:00:00")
                        .param("employeeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Test"));
    }
}
