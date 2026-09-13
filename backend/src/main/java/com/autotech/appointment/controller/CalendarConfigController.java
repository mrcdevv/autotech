package com.autotech.appointment.controller;

import com.autotech.appointment.dto.CalendarConfigRequest;
import com.autotech.appointment.dto.CalendarConfigResponse;
import com.autotech.appointment.service.CalendarConfigService;
import com.autotech.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calendar-config")
@RequiredArgsConstructor
public class CalendarConfigController {

    private final CalendarConfigService calendarConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<CalendarConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(calendarConfigService.getConfig()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<CalendarConfigResponse>> updateConfig(
            @Valid @RequestBody CalendarConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Configuración del calendario actualizada",
                calendarConfigService.updateConfig(request)));
    }
}
