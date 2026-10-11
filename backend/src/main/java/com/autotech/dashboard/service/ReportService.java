package com.autotech.dashboard.service;

import com.autotech.dashboard.dto.DashboardReportsResponse;
import com.autotech.dashboard.dto.FaultCountResponse;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    DashboardReportsResponse getReports(LocalDate from, LocalDate to);

    List<FaultCountResponse> getFaults(LocalDate from, LocalDate to, Long brandId);
}
