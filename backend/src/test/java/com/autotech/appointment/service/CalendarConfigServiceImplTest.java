package com.autotech.appointment.service;

import com.autotech.appointment.dto.AppointmentMapper;
import com.autotech.appointment.dto.CalendarConfigRequest;
import com.autotech.appointment.dto.CalendarConfigResponse;
import com.autotech.appointment.model.CalendarConfig;
import com.autotech.appointment.repository.CalendarConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalendarConfigServiceImplTest {

    @Mock
    private CalendarConfigRepository calendarConfigRepository;

    @Mock
    private AppointmentMapper appointmentMapper;

    @InjectMocks
    private CalendarConfigServiceImpl calendarConfigService;

    @Test
    void givenExistingConfig_whenGetConfig_thenReturnResponse() {
        // Arrange
        CalendarConfig config = buildConfig(1L);
        CalendarConfigResponse response = buildConfigResponse(1L);
        when(calendarConfigRepository.getConfig()).thenReturn(config);
        when(appointmentMapper.toCalendarConfigResponse(config)).thenReturn(response);

        // Act
        CalendarConfigResponse result = calendarConfigService.getConfig();

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.defaultAppointmentDurationMinutes()).isEqualTo(60);
    }

    @Test
    void givenValidRequest_whenUpdateConfig_thenReturnUpdatedResponse() {
        // Arrange
        CalendarConfig config = buildConfig(1L);
        CalendarConfigRequest request = new CalendarConfigRequest(
                45, LocalTime.of(8, 0), LocalTime.of(18, 0));
        CalendarConfig saved = buildConfig(1L);
        saved.setDefaultAppointmentDurationMinutes(45);
        saved.setStartTime(LocalTime.of(8, 0));
        saved.setEndTime(LocalTime.of(18, 0));
        CalendarConfigResponse response = new CalendarConfigResponse(
                1L, 45, LocalTime.of(8, 0), LocalTime.of(18, 0), null, null);

        when(calendarConfigRepository.getConfig()).thenReturn(config);
        when(calendarConfigRepository.save(config)).thenReturn(saved);
        when(appointmentMapper.toCalendarConfigResponse(saved)).thenReturn(response);

        // Act
        CalendarConfigResponse result = calendarConfigService.updateConfig(request);

        // Assert
        assertThat(result.defaultAppointmentDurationMinutes()).isEqualTo(45);
        assertThat(result.startTime()).isEqualTo(LocalTime.of(8, 0));
        assertThat(result.endTime()).isEqualTo(LocalTime.of(18, 0));
    }

    // --- Helpers ---

    private CalendarConfig buildConfig(Long id) {
        CalendarConfig config = CalendarConfig.builder()
                .defaultAppointmentDurationMinutes(60)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .build();
        config.setId(id);
        return config;
    }

    private CalendarConfigResponse buildConfigResponse(Long id) {
        return new CalendarConfigResponse(
                id, 60, LocalTime.of(9, 0), LocalTime.of(17, 0), null, null);
    }
}
