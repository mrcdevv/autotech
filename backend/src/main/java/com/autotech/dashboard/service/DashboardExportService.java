package com.autotech.dashboard.service;

import java.time.LocalDate;

public interface DashboardExportService {

    byte[] exportFinanciero(int months);

    byte[] exportProductividad();

    /** The reports page for the given period, one sheet per block. */
    byte[] exportReports(LocalDate from, LocalDate to);
}
