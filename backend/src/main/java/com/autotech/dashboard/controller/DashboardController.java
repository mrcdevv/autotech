package com.autotech.dashboard.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.dashboard.dto.DashboardConfigRequest;
import com.autotech.dashboard.dto.DashboardConfigResponse;
import com.autotech.dashboard.dto.DashboardFinancieroResponse;
import com.autotech.dashboard.dto.DashboardProductividadResponse;
import com.autotech.dashboard.dto.DashboardSummaryResponse;
import com.autotech.dashboard.model.DashboardConfig;
import com.autotech.dashboard.service.DashboardExportService;
import com.autotech.dashboard.service.DashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final DashboardExportService dashboardExportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getSummary()));
    }

    @GetMapping("/financiero")
    public ResponseEntity<ApiResponse<DashboardFinancieroResponse>> getFinanciero(
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getFinanciero(months)));
    }

    @GetMapping("/productividad")
    public ResponseEntity<ApiResponse<DashboardProductividadResponse>> getProductividad() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getProductividad()));
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<DashboardConfigResponse>> getConfig() {
        DashboardConfig config = dashboardService.getConfig();
        return ResponseEntity.ok(ApiResponse.success(
                new DashboardConfigResponse(config.getStaleThresholdDays())));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<DashboardConfigResponse>> updateConfig(
            @Valid @RequestBody DashboardConfigRequest request) {
        DashboardConfig config = dashboardService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.success(
                new DashboardConfigResponse(config.getStaleThresholdDays())));
    }

    @GetMapping("/export/financiero")
    public ResponseEntity<byte[]> exportFinanciero(
            @RequestParam(defaultValue = "6") int months) {
        byte[] file = dashboardExportService.exportFinanciero(months);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=dashboard_financiero.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(file);
    }

    @GetMapping("/export/productividad")
    public ResponseEntity<byte[]> exportProductividad() {
        byte[] file = dashboardExportService.exportProductividad();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=dashboard_productividad.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(file);
    }
}
