package com.autotech.appointment.controller;

import com.autotech.appointment.dto.CalendarConfigRequest;
import com.autotech.appointment.dto.CalendarConfigResponse;
import com.autotech.appointment.service.CalendarConfigService;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CalendarConfigController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class CalendarConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CalendarConfigService calendarConfigService;

    private final CalendarConfigResponse sampleResponse = new CalendarConfigResponse(
            1L, 60, LocalTime.of(9, 0), LocalTime.of(17, 0), null, null);

    @Test
    void givenConfig_whenGetConfig_thenReturn200() throws Exception {
        // Arrange
        when(calendarConfigService.getConfig()).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(get("/api/calendar-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultAppointmentDurationMinutes").value(60));
    }

    @Test
    void givenValidRequest_whenUpdateConfig_thenReturn200() throws Exception {
        // Arrange
        CalendarConfigRequest request = new CalendarConfigRequest(
                45, LocalTime.of(8, 0), LocalTime.of(18, 0));
        CalendarConfigResponse updated = new CalendarConfigResponse(
                1L, 45, LocalTime.of(8, 0), LocalTime.of(18, 0), null, null);
        when(calendarConfigService.updateConfig(any(CalendarConfigRequest.class))).thenReturn(updated);

        // Act & Assert
        mockMvc.perform(put("/api/calendar-config").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultAppointmentDurationMinutes").value(45));
    }

    @Test
    void givenNullDuration_whenUpdateConfig_thenReturn400() throws Exception {
        // Arrange
        CalendarConfigRequest request = new CalendarConfigRequest(null, null, null);

        // Act & Assert
        mockMvc.perform(put("/api/calendar-config").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenDurationLessThanOne_whenUpdateConfig_thenReturn400() throws Exception {
        // Arrange
        CalendarConfigRequest request = new CalendarConfigRequest(0, null, null);

        // Act & Assert
        mockMvc.perform(put("/api/calendar-config").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
