package com.autotech.appointment.service;

import com.autotech.appointment.dto.AppointmentMapper;
import com.autotech.appointment.dto.CalendarConfigRequest;
import com.autotech.appointment.dto.CalendarConfigResponse;
import com.autotech.appointment.model.CalendarConfig;
import com.autotech.appointment.repository.CalendarConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarConfigServiceImpl implements CalendarConfigService {

    private final CalendarConfigRepository calendarConfigRepository;
    private final AppointmentMapper appointmentMapper;

    @Override
    @Transactional(readOnly = true)
    public CalendarConfigResponse getConfig() {
        CalendarConfig config = calendarConfigRepository.getConfig();
        return appointmentMapper.toCalendarConfigResponse(config);
    }

    @Override
    @Transactional
    public CalendarConfigResponse updateConfig(CalendarConfigRequest request) {
        CalendarConfig config = calendarConfigRepository.getConfig();
        config.setDefaultAppointmentDurationMinutes(request.defaultAppointmentDurationMinutes());
        config.setStartTime(request.startTime());
        config.setEndTime(request.endTime());
        CalendarConfig saved = calendarConfigRepository.save(config);
        log.info("Updated calendar config: duration={}min, start={}, end={}",
                saved.getDefaultAppointmentDurationMinutes(), saved.getStartTime(), saved.getEndTime());
        return appointmentMapper.toCalendarConfigResponse(saved);
    }
}
