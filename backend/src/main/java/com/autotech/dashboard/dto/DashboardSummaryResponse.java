package com.autotech.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        Long openRepairOrderCount,
        Long todayAppointmentCount,
        BigDecimal monthlyRevenue,
        BigDecimal averageTicket,
        List<StatusCountResponse> repairOrderStatusCounts,
        List<TodayAppointmentResponse> todayAppointments,
        List<StaleOrderAlertResponse> staleOrderAlerts,
        List<PendingEstimateAlertResponse> pendingEstimateAlerts,
        Integer staleThresholdDays
) {}
