package com.autotech.dashboard.service;

import com.autotech.appointment.repository.AppointmentRepository;
import com.autotech.dashboard.dto.DashboardConfigRequest;
import com.autotech.dashboard.dto.DashboardFinancieroResponse;
import com.autotech.dashboard.dto.DashboardProductividadResponse;
import com.autotech.dashboard.dto.DashboardSummaryResponse;
import com.autotech.dashboard.dto.DebtAgingResponse;
import com.autotech.dashboard.dto.MechanicProductivityResponse;
import com.autotech.dashboard.dto.MonthlyRevenueResponse;
import com.autotech.dashboard.dto.PendingEstimateAlertResponse;
import com.autotech.dashboard.dto.StaleOrderAlertResponse;
import com.autotech.dashboard.dto.StatusCountResponse;
import com.autotech.dashboard.dto.TodayAppointmentResponse;
import com.autotech.dashboard.dto.TopServiceResponse;
import com.autotech.dashboard.dto.UnpaidInvoiceResponse;
import com.autotech.dashboard.model.DashboardConfig;
import com.autotech.dashboard.repository.DashboardConfigRepository;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.repository.EstimateRepository;
import com.autotech.invoice.model.InvoiceStatus;
import com.autotech.invoice.repository.InvoiceRepository;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final RepairOrderRepository repairOrderRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final EstimateRepository estimateRepository;
    private final DashboardConfigRepository dashboardConfigRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        DashboardConfig config = getConfigInternal();

        Long openOrderCount = repairOrderRepository.countByStatusNot(RepairOrderStatus.ENTREGADO);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        Long todayAppointmentCount = appointmentRepository.countByStartTimeBetween(todayStart, todayEnd);

        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        BigDecimal monthlyRevenue = invoiceRepository.sumTotalByStatusAndCreatedAtBetween(
                InvoiceStatus.PAGADA, monthStart, monthEnd);
        if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;

        BigDecimal averageTicket = invoiceRepository.avgTotalByStatusAndCreatedAtBetween(
                InvoiceStatus.PAGADA, monthStart, monthEnd);
        if (averageTicket == null) averageTicket = BigDecimal.ZERO;

        List<StatusCountResponse> statusCounts = repairOrderRepository.countGroupByStatus().stream()
                .map(row -> new StatusCountResponse(
                        ((RepairOrderStatus) row[0]).name(), (Long) row[1]))
                .toList();

        List<TodayAppointmentResponse> todayAppointments = appointmentRepository
                .findByDateRange(todayStart, todayEnd).stream()
                .limit(5)
                .map(a -> new TodayAppointmentResponse(
                        a.getId(),
                        a.getStartTime(),
                        a.getClient() != null ? a.getClient().getFirstName() + " " + a.getClient().getLastName() : null,
                        a.getVehicle() != null ? a.getVehicle().getPlate() : null,
                        a.getPurpose()))
                .toList();

        LocalDateTime staleThreshold = LocalDateTime.now().minusDays(config.getStaleThresholdDays());
        List<StaleOrderAlertResponse> staleAlerts = repairOrderRepository
                .findStaleOrders(staleThreshold, RepairOrderStatus.ENTREGADO).stream()
                .map(ro -> new StaleOrderAlertResponse(
                        ro.getId(),
                        ro.getTitle(),
                        ro.getClient().getFirstName() + " " + ro.getClient().getLastName(),
                        ro.getVehicle().getPlate(),
                        ro.getStatus().name(),
                        Duration.between(ro.getUpdatedAt(), LocalDateTime.now()).toDays()))
                .toList();

        List<PendingEstimateAlertResponse> pendingEstimates = estimateRepository
                .findPendingOlderThan(EstimateStatus.PENDIENTE, staleThreshold).stream()
                .map(e -> new PendingEstimateAlertResponse(
                        e.getId(),
                        e.getClient().getFirstName() + " " + e.getClient().getLastName(),
                        e.getVehicle().getPlate(),
                        e.getTotal(),
                        Duration.between(e.getCreatedAt(), LocalDateTime.now()).toDays()))
                .toList();

        return new DashboardSummaryResponse(
                openOrderCount, todayAppointmentCount, monthlyRevenue, averageTicket,
                statusCounts, todayAppointments, staleAlerts, pendingEstimates,
                config.getStaleThresholdDays());
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardFinancieroResponse getFinanciero(int months) {
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime rangeStart = LocalDate.now().minusMonths(months - 1).withDayOfMonth(1).atStartOfDay();
        List<MonthlyRevenueResponse> monthlyRevenue = invoiceRepository
                .sumTotalByStatusGroupByMonth(InvoiceStatus.PAGADA, rangeStart, now).stream()
                .map(row -> new MonthlyRevenueResponse((Integer) row[0], (Integer) row[1], (BigDecimal) row[2]))
                .toList();

        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        Long accepted = estimateRepository.countByStatusAndCreatedAtBetween(
                EstimateStatus.ACEPTADO, monthStart, monthEnd);
        Long totalEstimates = estimateRepository.countByCreatedAtBetween(monthStart, monthEnd);
        BigDecimal conversionRate = totalEstimates > 0
                ? BigDecimal.valueOf(accepted).divide(BigDecimal.valueOf(totalEstimates), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal totalPendingBilling = invoiceRepository.sumTotalByStatus(InvoiceStatus.PENDIENTE);
        if (totalPendingBilling == null) totalPendingBilling = BigDecimal.ZERO;

        List<DebtAgingResponse> debtAging = calculateDebtAging();

        List<UnpaidInvoiceResponse> topUnpaid = invoiceRepository
                .findByStatusWithClientAndVehicleOrderByTotalDesc(
                        InvoiceStatus.PENDIENTE, PageRequest.of(0, 10)).stream()
                .map(inv -> new UnpaidInvoiceResponse(
                        inv.getId(),
                        inv.getClient().getFirstName() + " " + inv.getClient().getLastName(),
                        inv.getVehicle() != null ? inv.getVehicle().getPlate() : null,
                        inv.getTotal(),
                        inv.getCreatedAt()))
                .toList();

        return new DashboardFinancieroResponse(
                monthlyRevenue, conversionRate, accepted, totalEstimates,
                totalPendingBilling, debtAging, topUnpaid);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardProductividadResponse getProductividad() {
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);

        BigDecimal avgRepairDays = repairOrderRepository.avgRepairDaysByStatusAndUpdatedAtBetween(
                RepairOrderStatus.ENTREGADO, monthStart, monthEnd);
        if (avgRepairDays == null) avgRepairDays = BigDecimal.ZERO;

        List<MechanicProductivityResponse> mechanics = repairOrderRepository
                .countCompletedByEmployee(RepairOrderStatus.ENTREGADO, monthStart, monthEnd).stream()
                .map(row -> new MechanicProductivityResponse((Long) row[0], (String) row[1], (Long) row[2]))
                .toList();

        List<TopServiceResponse> topServices = invoiceRepository
                .findTopServiceNames(InvoiceStatus.PAGADA, monthStart, monthEnd, PageRequest.of(0, 10)).stream()
                .map(row -> new TopServiceResponse((String) row[0], (Long) row[1]))
                .toList();

        return new DashboardProductividadResponse(avgRepairDays, mechanics, topServices);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardConfig getConfig() {
        return getConfigInternal();
    }

    @Override
    @Transactional
    public DashboardConfig updateConfig(DashboardConfigRequest request) {
        DashboardConfig config = getConfigInternal();
        config.setStaleThresholdDays(request.staleThresholdDays());
        return dashboardConfigRepository.save(config);
    }

    private DashboardConfig getConfigInternal() {
        return dashboardConfigRepository.findAll().stream().findFirst()
                .orElseGet(() -> dashboardConfigRepository.save(
                        DashboardConfig.builder().staleThresholdDays(5).build()));
    }

    private List<DebtAgingResponse> calculateDebtAging() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime d30 = now.minusDays(30);
        LocalDateTime d60 = now.minusDays(60);
        LocalDateTime d90 = now.minusDays(90);

        Object[] r0_30 = unwrapRow(invoiceRepository.countAndSumByStatusAndCreatedAtBetween(InvoiceStatus.PENDIENTE, d30, now));
        Object[] r31_60 = unwrapRow(invoiceRepository.countAndSumByStatusAndCreatedAtBetween(InvoiceStatus.PENDIENTE, d60, d30));
        Object[] r61_90 = unwrapRow(invoiceRepository.countAndSumByStatusAndCreatedAtBetween(InvoiceStatus.PENDIENTE, d90, d60));
        Object[] r90plus = unwrapRow(invoiceRepository.countAndSumByStatusAndCreatedAtBefore(InvoiceStatus.PENDIENTE, d90));

        return List.of(
                new DebtAgingResponse("0-30", toLong(r0_30[0]), toBigDecimal(r0_30[1])),
                new DebtAgingResponse("31-60", toLong(r31_60[0]), toBigDecimal(r31_60[1])),
                new DebtAgingResponse("61-90", toLong(r61_90[0]), toBigDecimal(r61_90[1])),
                new DebtAgingResponse("90+", toLong(r90plus[0]), toBigDecimal(r90plus[1]))
        );
    }

    private Object[] unwrapRow(Object[] result) {
        if (result != null && result.length == 1 && result[0] instanceof Object[]) {
            return (Object[]) result[0];
        }
        return result != null ? result : new Object[]{0L, BigDecimal.ZERO};
    }

    private Long toLong(Object val) {
        if (val == null) return 0L;
        if (val instanceof Long l) return l;
        return ((Number) val).longValue();
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal bd) return bd;
        return new BigDecimal(val.toString());
    }
}
