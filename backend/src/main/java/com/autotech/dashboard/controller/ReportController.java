package com.autotech.dashboard.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.dashboard.dto.DashboardReportsResponse;
import com.autotech.dashboard.dto.FaultCountResponse;
import com.autotech.dashboard.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardReportsResponse>> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getReports(from, to)));
    }

    @GetMapping("/faults")
    public ResponseEntity<ApiResponse<List<FaultCountResponse>>> getFaults(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long brandId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getFaults(from, to, brandId)));
    }
}
