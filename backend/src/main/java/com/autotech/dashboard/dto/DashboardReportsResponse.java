package com.autotech.dashboard.dto;

import java.util.List;

public record DashboardReportsResponse(
        List<MonthlyRevenueResponse> monthlyBilling,
        List<TopServiceResponse> topServices,
        List<ServiceRevenueResponse> serviceRevenue,
        List<BrandCountResponse> brandCounts
) {}
