package com.autotech.appointment.service;

import com.autotech.appointment.dto.CalendarConfigRequest;
import com.autotech.appointment.dto.CalendarConfigResponse;

public interface CalendarConfigService {

    CalendarConfigResponse getConfig();

    CalendarConfigResponse updateConfig(CalendarConfigRequest request);
}
