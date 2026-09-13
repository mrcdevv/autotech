package com.autotech.dashboard.service;

public interface DashboardExportService {

    byte[] exportFinanciero(int months);

    byte[] exportProductividad();
}
