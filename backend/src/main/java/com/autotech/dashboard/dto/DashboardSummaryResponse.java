package com.autotech.dashboard.dto;

import java.util.List;

public record DashboardSummaryResponse(
        Long openRepairOrderCount,
        Long readyForPickupCount,
        Long todayAppointmentCount,
        Long pendingEstimateCount,
        List<StatusCountResponse> repairOrderStatusCounts,
        List<TodayAppointmentResponse> todayAppointments,
        List<ReadyForPickupResponse> readyForPickupOrders,
        List<StaleOrderAlertResponse> staleOrderAlerts,
        List<PendingEstimateAlertResponse> pendingEstimateAlerts,
        Integer staleThresholdDays
) {}
