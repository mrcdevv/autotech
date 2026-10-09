package com.autotech.dashboard.service;

import com.autotech.dashboard.dto.BrandCountResponse;
import com.autotech.dashboard.dto.DashboardReportsResponse;
import com.autotech.dashboard.dto.FaultCountResponse;
import com.autotech.dashboard.dto.MonthlyRevenueResponse;
import com.autotech.dashboard.dto.ServiceRevenueResponse;
import com.autotech.dashboard.dto.TopServiceResponse;
import com.autotech.inspection.model.InspectionItemStatus;
import com.autotech.inspection.repository.InspectionItemRepository;
import com.autotech.invoice.repository.InvoiceRepository;
import com.autotech.repairorder.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final List<InspectionItemStatus> FAULT_STATUSES =
            List.of(InspectionItemStatus.PROBLEMA, InspectionItemStatus.REVISAR);

    private final InvoiceRepository invoiceRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final InspectionItemRepository inspectionItemRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardReportsResponse getReports(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        List<MonthlyRevenueResponse> monthlyBilling = invoiceRepository
                .sumTotalGroupByMonth(start, end).stream()
                .map(row -> new MonthlyRevenueResponse((Integer) row[0], (Integer) row[1], (BigDecimal) row[2]))
                .toList();

        List<TopServiceResponse> topServices = invoiceRepository
                .countServiceOccurrences(start, end).stream()
                .map(row -> new TopServiceResponse((String) row[0], (Long) row[1]))
                .toList();

        List<ServiceRevenueResponse> serviceRevenue = invoiceRepository
                .sumServiceRevenue(start, end).stream()
                .map(row -> new ServiceRevenueResponse((String) row[0], (BigDecimal) row[1]))
                .toList();

        List<BrandCountResponse> brandCounts = repairOrderRepository
                .countByBrand(start, end).stream()
                .map(row -> new BrandCountResponse((String) row[0], (Long) row[1]))
                .toList();

        return new DashboardReportsResponse(monthlyBilling, topServices, serviceRevenue, brandCounts);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FaultCountResponse> getFaults(LocalDate from, LocalDate to, Long brandId) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        return inspectionItemRepository
                .countFaultsByPeriodAndBrand(FAULT_STATUSES, start, end, brandId).stream()
                .map(row -> new FaultCountResponse((String) row[0], (Long) row[1]))
                .toList();
    }
}
