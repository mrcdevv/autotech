package com.autotech.dashboard.service;

import com.autotech.dashboard.dto.DashboardConfigRequest;
import com.autotech.dashboard.dto.DashboardFinancieroResponse;
import com.autotech.dashboard.dto.DashboardProductividadResponse;
import com.autotech.dashboard.dto.DashboardSummaryResponse;
import com.autotech.dashboard.model.DashboardConfig;

public interface DashboardService {

    DashboardSummaryResponse getSummary();

    DashboardFinancieroResponse getFinanciero(int months);

    DashboardProductividadResponse getProductividad();

    DashboardConfig getConfig();

    DashboardConfig updateConfig(DashboardConfigRequest request);
}
