package com.autotech.dashboard.service;

import com.autotech.dashboard.dto.BrandCountResponse;
import com.autotech.dashboard.dto.DashboardReportsResponse;
import com.autotech.dashboard.dto.DebtAgingResponse;
import com.autotech.dashboard.dto.FaultCountResponse;
import com.autotech.dashboard.dto.MechanicProductivityResponse;
import com.autotech.dashboard.dto.MonthlyBillingResponse;
import com.autotech.dashboard.dto.ReportKpisResponse;
import com.autotech.dashboard.dto.ServiceStatsResponse;
import com.autotech.dashboard.dto.UnpaidDeliveryNoteResponse;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import com.autotech.deliverynote.repository.DeliveryNoteRepository;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.repository.EstimateRepository;
import com.autotech.inspection.model.InspectionItemStatus;
import com.autotech.inspection.repository.InspectionItemRepository;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final List<InspectionItemStatus> FAULT_STATUSES =
            List.of(InspectionItemStatus.PROBLEMA, InspectionItemStatus.REVISAR);

    private final DeliveryNoteRepository deliveryNoteRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final InspectionItemRepository inspectionItemRepository;
    private final EstimateRepository estimateRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardReportsResponse getReports(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        List<MonthlyBillingResponse> monthlyBilling = deliveryNoteRepository
                .sumBilledAndCollectedGroupByMonth(DeliveryNoteStatus.PAGADA, start, end).stream()
                .map(row -> new MonthlyBillingResponse(
                        toInt(row[0]), toInt(row[1]), toBigDecimal(row[2]), toBigDecimal(row[3])))
                .toList();

        List<ServiceStatsResponse> services = deliveryNoteRepository
                .summarizeServices(start, end).stream()
                .map(row -> new ServiceStatsResponse((String) row[0], toLong(row[1]), toBigDecimal(row[2])))
                .toList();

        List<BrandCountResponse> brandCounts = repairOrderRepository
                .countByBrand(start, end).stream()
                .map(row -> new BrandCountResponse((String) row[0], toLong(row[1])))
                .toList();

        List<MechanicProductivityResponse> mechanicProductivity = repairOrderRepository
                .countCompletedByEmployee(RepairOrderStatus.ENTREGADO, start, end).stream()
                .map(row -> new MechanicProductivityResponse(toLong(row[0]), (String) row[1], toLong(row[2])))
                .toList();

        BigDecimal averageRepairDays = repairOrderRepository
                .avgRepairDaysByStatusAndDeliveredAtBetween(RepairOrderStatus.ENTREGADO, start, end);
        averageRepairDays = averageRepairDays == null
                ? BigDecimal.ZERO
                : averageRepairDays.setScale(1, RoundingMode.HALF_UP);

        LocalDateTime now = LocalDateTime.now();
        List<DeliveryNote> unpaid = deliveryNoteRepository
                .findByStatusCreatedBefore(DeliveryNoteStatus.PENDIENTE, now).stream()
                .sorted(Comparator.comparing(DeliveryNote::getCreatedAt))
                .toList();

        return new DashboardReportsResponse(
                buildKpis(start, end),
                monthlyBilling,
                services,
                brandCounts,
                buildDebtAging(unpaid, now),
                unpaid.stream().map(this::toUnpaidResponse).toList(),
                mechanicProductivity,
                averageRepairDays);
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

    private ReportKpisResponse buildKpis(LocalDateTime start, LocalDateTime end) {
        List<Object[]> rows = deliveryNoteRepository.summarizeBilling(DeliveryNoteStatus.PAGADA, start, end);
        Object[] row = rows.isEmpty() ? new Object[]{0L, BigDecimal.ZERO, 0L, BigDecimal.ZERO} : rows.get(0);

        long deliveryNoteCount = toLong(row[0]);
        BigDecimal billed = toBigDecimal(row[1]);
        long paidCount = toLong(row[2]);
        BigDecimal collected = toBigDecimal(row[3]);
        BigDecimal averageTicket = deliveryNoteCount > 0
                ? billed.divide(BigDecimal.valueOf(deliveryNoteCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        long estimatesTotal = toLong(estimateRepository.countByCreatedAtBetween(start, end));
        long estimatesAccepted = toLong(estimateRepository.countByStatusAndCreatedAtBetween(
                EstimateStatus.ACEPTADO, start, end));

        return new ReportKpisResponse(
                billed,
                collected,
                billed.subtract(collected),
                deliveryNoteCount,
                deliveryNoteCount - paidCount,
                averageTicket,
                estimatesTotal,
                estimatesAccepted,
                repairOrderRepository.countCreatedBetween(start, end));
    }

    /** Same buckets as the financial dashboard: 0-30, 31-60, 61-90 and 90+ days since issue. */
    private List<DebtAgingResponse> buildDebtAging(List<DeliveryNote> unpaid, LocalDateTime now) {
        long[] counts = new long[4];
        BigDecimal[] amounts = {BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};

        for (DeliveryNote note : unpaid) {
            long days = ChronoUnit.DAYS.between(note.getCreatedAt(), now);
            int bucket = days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : 3;
            counts[bucket]++;
            amounts[bucket] = amounts[bucket].add(note.getTotal() != null ? note.getTotal() : BigDecimal.ZERO);
        }

        return List.of(
                new DebtAgingResponse("0-30", counts[0], amounts[0]),
                new DebtAgingResponse("31-60", counts[1], amounts[1]),
                new DebtAgingResponse("61-90", counts[2], amounts[2]),
                new DebtAgingResponse("90+", counts[3], amounts[3]));
    }

    private UnpaidDeliveryNoteResponse toUnpaidResponse(DeliveryNote note) {
        return new UnpaidDeliveryNoteResponse(
                note.getId(),
                note.getClient().getFirstName() + " " + note.getClient().getLastName(),
                note.getVehicle() != null ? note.getVehicle().getPlate() : null,
                note.getTotal() != null ? note.getTotal() : BigDecimal.ZERO,
                note.getCreatedAt());
    }

    private static int toInt(Object value) {
        return value == null ? 0 : ((Number) value).intValue();
    }

    private static long toLong(Object value) {
        return value == null ? 0L : ((Number) value).longValue();
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }
}
