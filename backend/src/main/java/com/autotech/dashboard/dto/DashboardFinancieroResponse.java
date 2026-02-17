package com.autotech.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardFinancieroResponse(
        List<MonthlyRevenueResponse> monthlyRevenue,
        BigDecimal estimateConversionRate,
        Long estimatesAccepted,
        Long estimatesTotal,
        BigDecimal totalPendingBilling,
        List<DebtAgingResponse> debtAging,
        List<UnpaidInvoiceResponse> topUnpaidInvoices
) {}
