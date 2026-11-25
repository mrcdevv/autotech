package com.autotech.dashboard.service;

import com.autotech.client.model.Client;
import com.autotech.dashboard.dto.DashboardReportsResponse;
import com.autotech.dashboard.dto.DebtAgingResponse;
import com.autotech.dashboard.dto.ReportKpisResponse;
import com.autotech.deliverynote.model.DeliveryNote;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import com.autotech.deliverynote.repository.DeliveryNoteRepository;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.repository.EstimateRepository;
import com.autotech.inspection.repository.InspectionItemRepository;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.vehicle.model.Vehicle;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    private static final LocalDate FROM = LocalDate.of(2026, 1, 1);
    private static final LocalDate TO = LocalDate.of(2026, 12, 31);

    @Mock
    private DeliveryNoteRepository deliveryNoteRepository;

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private InspectionItemRepository inspectionItemRepository;

    @Mock
    private EstimateRepository estimateRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    void givenBilledAndPaidNotes_whenGetReports_thenKpisSplitCollectedAndPending() {
        // Arrange
        stubEmptyLists();
        when(deliveryNoteRepository.summarizeBilling(eq(DeliveryNoteStatus.PAGADA), any(), any()))
                .thenReturn(Collections.singletonList(
                        new Object[]{4L, new BigDecimal("1000.00"), 3L, new BigDecimal("700.00")}));
        when(estimateRepository.countByCreatedAtBetween(any(), any())).thenReturn(4L);
        when(estimateRepository.countByStatusAndCreatedAtBetween(eq(EstimateStatus.ACEPTADO), any(), any()))
                .thenReturn(1L);
        when(repairOrderRepository.countCreatedBetween(any(), any())).thenReturn(6L);

        // Act
        ReportKpisResponse kpis = reportService.getReports(FROM, TO).kpis();

        // Assert
        assertThat(kpis.totalBilled()).isEqualByComparingTo("1000.00");
        assertThat(kpis.totalCollected()).isEqualByComparingTo("700.00");
        assertThat(kpis.totalPending()).isEqualByComparingTo("300.00");
        assertThat(kpis.deliveryNoteCount()).isEqualTo(4L);
        assertThat(kpis.pendingDeliveryNoteCount()).isEqualTo(1L);
        assertThat(kpis.averageTicket()).isEqualByComparingTo("250.00");
        assertThat(kpis.estimatesTotal()).isEqualTo(4L);
        assertThat(kpis.estimatesAccepted()).isEqualTo(1L);
        assertThat(kpis.repairOrderCount()).isEqualTo(6L);
    }

    @Test
    void givenNoDeliveryNotes_whenGetReports_thenAverageTicketIsZero() {
        // Arrange
        stubEmptyLists();
        when(deliveryNoteRepository.summarizeBilling(any(), any(), any()))
                .thenReturn(Collections.singletonList(new Object[]{0L, BigDecimal.ZERO, 0L, BigDecimal.ZERO}));

        // Act
        ReportKpisResponse kpis = reportService.getReports(FROM, TO).kpis();

        // Assert
        assertThat(kpis.averageTicket()).isEqualByComparingTo("0");
        assertThat(kpis.totalPending()).isEqualByComparingTo("0");
    }

    @Test
    void givenUnpaidNotesOfDifferentAges_whenGetReports_thenBucketsDebtAndListsOldestFirst() {
        // Arrange
        stubEmptyLists();
        DeliveryNote recent = unpaidNote(1L, "100.00", 5);
        DeliveryNote month = unpaidNote(2L, "200.00", 45);
        DeliveryNote quarter = unpaidNote(3L, "300.00", 75);
        DeliveryNote old = unpaidNote(4L, "400.00", 120);
        DeliveryNote older = unpaidNote(5L, "50.00", 200);
        when(deliveryNoteRepository.findByStatusCreatedBefore(eq(DeliveryNoteStatus.PENDIENTE), any()))
                .thenReturn(List.of(recent, old, month, older, quarter));

        // Act
        DashboardReportsResponse result = reportService.getReports(FROM, TO);

        // Assert
        assertThat(result.debtAging()).extracting(DebtAgingResponse::range)
                .containsExactly("0-30", "31-60", "61-90", "90+");
        assertThat(result.debtAging()).extracting(DebtAgingResponse::deliveryNoteCount)
                .containsExactly(1L, 1L, 1L, 2L);
        assertThat(result.debtAging().get(3).totalAmount()).isEqualByComparingTo("450.00");
        assertThat(result.unpaidDeliveryNotes())
                .extracting(note -> note.deliveryNoteId())
                .containsExactly(5L, 4L, 3L, 2L, 1L);
        assertThat(result.unpaidDeliveryNotes().get(0).clientFullName()).isEqualTo("Carlos Lopez");
    }

    @Test
    void givenDeliveredOrders_whenGetReports_thenAverageRepairDaysIsRoundedToOneDecimal() {
        // Arrange
        stubEmptyLists();
        when(repairOrderRepository.avgRepairDaysByStatusAndDeliveredAtBetween(
                eq(RepairOrderStatus.ENTREGADO), any(), any()))
                .thenReturn(new BigDecimal("4.26666"));

        // Act
        DashboardReportsResponse result = reportService.getReports(FROM, TO);

        // Assert
        assertThat(result.averageRepairDays()).isEqualByComparingTo("4.3");
    }

    @Test
    void givenMonthlyRows_whenGetReports_thenMapsBilledAndCollected() {
        // Arrange
        stubEmptyLists();
        when(deliveryNoteRepository.sumBilledAndCollectedGroupByMonth(eq(DeliveryNoteStatus.PAGADA), any(), any()))
                .thenReturn(Collections.singletonList(
                        new Object[]{2026, 11, new BigDecimal("500.00"), new BigDecimal("200.00")}));
        when(deliveryNoteRepository.summarizeServices(any(), any()))
                .thenReturn(Collections.singletonList(new Object[]{"Alineacion", 3L, new BigDecimal("90.00")}));

        // Act
        DashboardReportsResponse result = reportService.getReports(FROM, TO);

        // Assert
        assertThat(result.monthlyBilling()).singleElement().satisfies(month -> {
            assertThat(month.year()).isEqualTo(2026);
            assertThat(month.month()).isEqualTo(11);
            assertThat(month.billed()).isEqualByComparingTo("500.00");
            assertThat(month.collected()).isEqualByComparingTo("200.00");
        });
        assertThat(result.services()).singleElement().satisfies(service -> {
            assertThat(service.serviceName()).isEqualTo("Alineacion");
            assertThat(service.count()).isEqualTo(3L);
            assertThat(service.totalRevenue()).isEqualByComparingTo("90.00");
        });
    }

    private void stubEmptyLists() {
        lenient().when(deliveryNoteRepository.sumBilledAndCollectedGroupByMonth(any(), any(), any())).thenReturn(List.of());
        lenient().when(deliveryNoteRepository.summarizeServices(any(), any())).thenReturn(List.of());
        lenient().when(deliveryNoteRepository.summarizeBilling(any(), any(), any())).thenReturn(List.of());
        lenient().when(deliveryNoteRepository.findByStatusCreatedBefore(any(), any())).thenReturn(List.of());
        lenient().when(repairOrderRepository.countByBrand(any(), any())).thenReturn(List.of());
        lenient().when(repairOrderRepository.countCompletedByEmployee(any(), any(), any())).thenReturn(List.of());
    }

    private DeliveryNote unpaidNote(Long id, String total, int daysAgo) {
        Client client = Client.builder().firstName("Carlos").lastName("Lopez").build();
        client.setId(id);
        Vehicle vehicle = Vehicle.builder().plate("DEF456").build();
        vehicle.setId(id);
        DeliveryNote note = DeliveryNote.builder()
                .client(client)
                .vehicle(vehicle)
                .total(new BigDecimal(total))
                .status(DeliveryNoteStatus.PENDIENTE)
                .build();
        note.setId(id);
        note.setCreatedAt(LocalDateTime.now().minusDays(daysAgo).minusHours(1));
        return note;
    }
}
