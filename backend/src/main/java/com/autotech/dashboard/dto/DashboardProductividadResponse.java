package com.autotech.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardProductividadResponse(
        BigDecimal averageRepairDays,
        List<MechanicProductivityResponse> mechanicProductivity,
        List<TopServiceResponse> topServices
) {}
