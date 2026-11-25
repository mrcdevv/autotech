package com.autotech.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Everything the reports page shows for a period. {@code debtAging} and
 * {@code unpaidDeliveryNotes} are the debt as of today, regardless of the period.
 */
public record DashboardReportsResponse(
        ReportKpisResponse kpis,
        List<MonthlyBillingResponse> monthlyBilling,
        List<ServiceStatsResponse> services,
        List<BrandCountResponse> brandCounts,
        List<DebtAgingResponse> debtAging,
        List<UnpaidDeliveryNoteResponse> unpaidDeliveryNotes,
        List<MechanicProductivityResponse> mechanicProductivity,
        BigDecimal averageRepairDays
) {}
