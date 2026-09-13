package com.autotech.dashboard.service;

import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.repository.AppointmentRepository;
import com.autotech.client.model.Client;
import com.autotech.dashboard.dto.DashboardFinancieroResponse;
import com.autotech.dashboard.dto.DashboardProductividadResponse;
import com.autotech.dashboard.dto.DashboardSummaryResponse;
import com.autotech.dashboard.dto.DashboardConfigRequest;
import com.autotech.dashboard.model.DashboardConfig;
import com.autotech.dashboard.repository.DashboardConfigRepository;
import com.autotech.estimate.model.Estimate;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.repository.EstimateRepository;
import com.autotech.invoice.model.Invoice;
import com.autotech.invoice.model.InvoiceStatus;
import com.autotech.invoice.repository.InvoiceRepository;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.repository.RepairOrderRepository;
import com.autotech.vehicle.model.Vehicle;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private EstimateRepository estimateRepository;

    @Mock
    private DashboardConfigRepository dashboardConfigRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    // --- getSummary tests ---

    @Test
    void givenDataExists_whenGetSummary_thenReturnAllFields() {
        // Arrange
        DashboardConfig config = buildConfig();
        when(dashboardConfigRepository.findAll()).thenReturn(List.of(config));
        when(repairOrderRepository.countByStatusNot(RepairOrderStatus.ENTREGADO)).thenReturn(5L);
        when(repairOrderRepository.countByStatus(RepairOrderStatus.LISTO_PARA_ENTREGAR)).thenReturn(2L);
        when(appointmentRepository.countByStartTimeBetween(any(), any())).thenReturn(3L);
        when(estimateRepository.countByStatus(EstimateStatus.PENDIENTE)).thenReturn(4L);
        List<Object[]> statusData = new java.util.ArrayList<>();
        statusData.add(new Object[]{RepairOrderStatus.REPARACION, 3L});
        statusData.add(new Object[]{RepairOrderStatus.ENTREGADO, 2L});
        when(repairOrderRepository.countGroupByStatus()).thenReturn(statusData);
        when(appointmentRepository.findByDateRange(any(), any())).thenReturn(Collections.emptyList());
        when(repairOrderRepository.findByStatusWithClientAndVehicle(RepairOrderStatus.LISTO_PARA_ENTREGAR))
                .thenReturn(Collections.emptyList());
        when(repairOrderRepository.findStaleOrders(any(), any())).thenReturn(Collections.emptyList());
        when(estimateRepository.findPendingOlderThan(any(), any())).thenReturn(Collections.emptyList());

        // Act
        DashboardSummaryResponse result = dashboardService.getSummary();

        // Assert
        assertThat(result.openRepairOrderCount()).isEqualTo(5L);
        assertThat(result.readyForPickupCount()).isEqualTo(2L);
        assertThat(result.todayAppointmentCount()).isEqualTo(3L);
        assertThat(result.pendingEstimateCount()).isEqualTo(4L);
        assertThat(result.repairOrderStatusCounts()).hasSize(2);
        assertThat(result.staleThresholdDays()).isEqualTo(5);
    }

    @Test
    void givenNoData_whenGetSummary_thenReturnZeros() {
        // Arrange
        DashboardConfig config = buildConfig();
        when(dashboardConfigRepository.findAll()).thenReturn(List.of(config));
        when(repairOrderRepository.countByStatusNot(RepairOrderStatus.ENTREGADO)).thenReturn(0L);
        when(repairOrderRepository.countByStatus(RepairOrderStatus.LISTO_PARA_ENTREGAR)).thenReturn(0L);
        when(appointmentRepository.countByStartTimeBetween(any(), any())).thenReturn(0L);
        when(estimateRepository.countByStatus(EstimateStatus.PENDIENTE)).thenReturn(0L);
        when(repairOrderRepository.countGroupByStatus()).thenReturn(Collections.emptyList());
        when(appointmentRepository.findByDateRange(any(), any())).thenReturn(Collections.emptyList());
        when(repairOrderRepository.findByStatusWithClientAndVehicle(any())).thenReturn(Collections.emptyList());
        when(repairOrderRepository.findStaleOrders(any(), any())).thenReturn(Collections.emptyList());
        when(estimateRepository.findPendingOlderThan(any(), any())).thenReturn(Collections.emptyList());

        // Act
        DashboardSummaryResponse result = dashboardService.getSummary();

        // Assert
        assertThat(result.openRepairOrderCount()).isZero();
        assertThat(result.readyForPickupCount()).isZero();
        assertThat(result.todayAppointmentCount()).isZero();
        assertThat(result.pendingEstimateCount()).isZero();
        assertThat(result.repairOrderStatusCounts()).isEmpty();
        assertThat(result.todayAppointments()).isEmpty();
        assertThat(result.readyForPickupOrders()).isEmpty();
        assertThat(result.staleOrderAlerts()).isEmpty();
        assertThat(result.pendingEstimateAlerts()).isEmpty();
    }

    @Test
    void givenAppointments_whenGetSummary_thenReturnMax5() {
        // Arrange
        DashboardConfig config = buildConfig();
        when(dashboardConfigRepository.findAll()).thenReturn(List.of(config));
        when(repairOrderRepository.countByStatusNot(any())).thenReturn(0L);
        when(repairOrderRepository.countByStatus(any())).thenReturn(0L);
        when(appointmentRepository.countByStartTimeBetween(any(), any())).thenReturn(6L);
        when(estimateRepository.countByStatus(any())).thenReturn(0L);
        when(repairOrderRepository.countGroupByStatus()).thenReturn(Collections.emptyList());

        List<Appointment> appointments = new java.util.ArrayList<>();
        for (int i = 0; i < 6; i++) {
            Appointment a = Appointment.builder()
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now().plusHours(1))
                    .purpose("Test " + i)
                    .build();
            a.setId((long) i);
            appointments.add(a);
        }
        when(appointmentRepository.findByDateRange(any(), any())).thenReturn(appointments);
        when(repairOrderRepository.findByStatusWithClientAndVehicle(any())).thenReturn(Collections.emptyList());
        when(repairOrderRepository.findStaleOrders(any(), any())).thenReturn(Collections.emptyList());
        when(estimateRepository.findPendingOlderThan(any(), any())).thenReturn(Collections.emptyList());

        // Act
        DashboardSummaryResponse result = dashboardService.getSummary();

        // Assert
        assertThat(result.todayAppointments()).hasSize(5);
    }

    @Test
    void givenStaleOrders_whenGetSummary_thenReturnAlerts() {
        // Arrange
        DashboardConfig config = buildConfig();
        when(dashboardConfigRepository.findAll()).thenReturn(List.of(config));
        when(repairOrderRepository.countByStatusNot(any())).thenReturn(1L);
        when(repairOrderRepository.countByStatus(any())).thenReturn(0L);
        when(appointmentRepository.countByStartTimeBetween(any(), any())).thenReturn(0L);
        when(estimateRepository.countByStatus(any())).thenReturn(0L);
        when(repairOrderRepository.countGroupByStatus()).thenReturn(Collections.emptyList());
        when(appointmentRepository.findByDateRange(any(), any())).thenReturn(Collections.emptyList());
        when(repairOrderRepository.findByStatusWithClientAndVehicle(any())).thenReturn(Collections.emptyList());

        RepairOrder staleOrder = buildRepairOrder(1L, "Cambio de aceite", RepairOrderStatus.REPARACION);
        staleOrder.setUpdatedAt(LocalDateTime.now().minusDays(10));
        when(repairOrderRepository.findStaleOrders(any(), any())).thenReturn(List.of(staleOrder));
        when(estimateRepository.findPendingOlderThan(any(), any())).thenReturn(Collections.emptyList());

        // Act
        DashboardSummaryResponse result = dashboardService.getSummary();

        // Assert
        assertThat(result.staleOrderAlerts()).hasSize(1);
        assertThat(result.staleOrderAlerts().getFirst().repairOrderId()).isEqualTo(1L);
        assertThat(result.staleOrderAlerts().getFirst().daysSinceLastUpdate()).isGreaterThanOrEqualTo(10);
    }

    @Test
    void givenPendingEstimates_whenGetSummary_thenReturnAlerts() {
        // Arrange
        DashboardConfig config = buildConfig();
        when(dashboardConfigRepository.findAll()).thenReturn(List.of(config));
        when(repairOrderRepository.countByStatusNot(any())).thenReturn(0L);
        when(repairOrderRepository.countByStatus(any())).thenReturn(0L);
        when(appointmentRepository.countByStartTimeBetween(any(), any())).thenReturn(0L);
        when(estimateRepository.countByStatus(any())).thenReturn(0L);
        when(repairOrderRepository.countGroupByStatus()).thenReturn(Collections.emptyList());
        when(appointmentRepository.findByDateRange(any(), any())).thenReturn(Collections.emptyList());
        when(repairOrderRepository.findByStatusWithClientAndVehicle(any())).thenReturn(Collections.emptyList());
        when(repairOrderRepository.findStaleOrders(any(), any())).thenReturn(Collections.emptyList());

        Estimate pendingEstimate = buildEstimate(1L);
        pendingEstimate.setCreatedAt(LocalDateTime.now().minusDays(7));
        when(estimateRepository.findPendingOlderThan(any(), any())).thenReturn(List.of(pendingEstimate));

        // Act
        DashboardSummaryResponse result = dashboardService.getSummary();

        // Assert
        assertThat(result.pendingEstimateAlerts()).hasSize(1);
        assertThat(result.pendingEstimateAlerts().getFirst().estimateId()).isEqualTo(1L);
    }

    // --- getFinanciero tests ---

    @Test
    void givenData_whenGetFinanciero_thenReturnAllFields() {
        // Arrange
        List<Object[]> monthlyData = new java.util.ArrayList<>();
        monthlyData.add(new Object[]{2026, 1, new BigDecimal("30000")});
        monthlyData.add(new Object[]{2026, 2, new BigDecimal("45000")});
        when(invoiceRepository.sumTotalByStatusGroupByMonth(eq(InvoiceStatus.PAGADA), any(), any()))
                .thenReturn(monthlyData);
        when(estimateRepository.countByStatusAndCreatedAtBetween(eq(EstimateStatus.ACEPTADO), any(), any()))
                .thenReturn(8L);
        when(estimateRepository.countByCreatedAtBetween(any(), any())).thenReturn(10L);
        when(invoiceRepository.sumTotalByStatus(InvoiceStatus.PENDIENTE)).thenReturn(new BigDecimal("15000"));
        when(invoiceRepository.countAndSumByStatusAndCreatedAtBetween(any(), any(), any()))
                .thenReturn(new Object[]{2L, new BigDecimal("5000")});
        when(invoiceRepository.countAndSumByStatusAndCreatedAtBefore(any(), any()))
                .thenReturn(new Object[]{1L, new BigDecimal("3000")});
        when(invoiceRepository.findByStatusWithClientAndVehicleOrderByTotalDesc(any(), any()))
                .thenReturn(Collections.emptyList());

        // Act
        DashboardFinancieroResponse result = dashboardService.getFinanciero(6);

        // Assert
        assertThat(result.monthlyRevenue()).hasSize(2);
        assertThat(result.estimateConversionRate()).isEqualByComparingTo(new BigDecimal("80.0000"));
        assertThat(result.estimatesAccepted()).isEqualTo(8L);
        assertThat(result.estimatesTotal()).isEqualTo(10L);
        assertThat(result.totalPendingBilling()).isEqualByComparingTo(new BigDecimal("15000"));
        assertThat(result.debtAging()).hasSize(4);
    }

    @Test
    void givenNoEstimates_whenGetFinanciero_thenConversionRateIsZero() {
        // Arrange
        when(invoiceRepository.sumTotalByStatusGroupByMonth(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(estimateRepository.countByStatusAndCreatedAtBetween(any(), any(), any())).thenReturn(0L);
        when(estimateRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
        when(invoiceRepository.sumTotalByStatus(any())).thenReturn(null);
        when(invoiceRepository.countAndSumByStatusAndCreatedAtBetween(any(), any(), any()))
                .thenReturn(new Object[]{0L, BigDecimal.ZERO});
        when(invoiceRepository.countAndSumByStatusAndCreatedAtBefore(any(), any()))
                .thenReturn(new Object[]{0L, BigDecimal.ZERO});
        when(invoiceRepository.findByStatusWithClientAndVehicleOrderByTotalDesc(any(), any()))
                .thenReturn(Collections.emptyList());

        // Act
        DashboardFinancieroResponse result = dashboardService.getFinanciero(6);

        // Assert
        assertThat(result.estimateConversionRate()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.totalPendingBilling()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void givenDebtAging_whenGetFinanciero_thenReturnFourRanges() {
        // Arrange
        when(invoiceRepository.sumTotalByStatusGroupByMonth(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(estimateRepository.countByStatusAndCreatedAtBetween(any(), any(), any())).thenReturn(0L);
        when(estimateRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
        when(invoiceRepository.sumTotalByStatus(any())).thenReturn(BigDecimal.ZERO);
        when(invoiceRepository.countAndSumByStatusAndCreatedAtBetween(eq(InvoiceStatus.PENDIENTE), any(), any()))
                .thenReturn(new Object[]{3L, new BigDecimal("9000")});
        when(invoiceRepository.countAndSumByStatusAndCreatedAtBefore(eq(InvoiceStatus.PENDIENTE), any()))
                .thenReturn(new Object[]{1L, new BigDecimal("2000")});
        when(invoiceRepository.findByStatusWithClientAndVehicleOrderByTotalDesc(any(), any()))
                .thenReturn(Collections.emptyList());

        // Act
        DashboardFinancieroResponse result = dashboardService.getFinanciero(6);

        // Assert
        assertThat(result.debtAging()).hasSize(4);
        assertThat(result.debtAging().get(0).range()).isEqualTo("0-30");
        assertThat(result.debtAging().get(1).range()).isEqualTo("31-60");
        assertThat(result.debtAging().get(2).range()).isEqualTo("61-90");
        assertThat(result.debtAging().get(3).range()).isEqualTo("90+");
    }

    @Test
    void givenUnpaidInvoices_whenGetFinanciero_thenReturnTopUnpaid() {
        // Arrange
        when(invoiceRepository.sumTotalByStatusGroupByMonth(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(estimateRepository.countByStatusAndCreatedAtBetween(any(), any(), any())).thenReturn(0L);
        when(estimateRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
        when(invoiceRepository.sumTotalByStatus(any())).thenReturn(BigDecimal.ZERO);
        when(invoiceRepository.countAndSumByStatusAndCreatedAtBetween(any(InvoiceStatus.class), any(), any()))
                .thenReturn(new Object[]{0L, BigDecimal.ZERO});
        when(invoiceRepository.countAndSumByStatusAndCreatedAtBefore(any(InvoiceStatus.class), any()))
                .thenReturn(new Object[]{0L, BigDecimal.ZERO});

        Invoice inv = buildInvoice(1L, new BigDecimal("5000"));
        when(invoiceRepository.findByStatusWithClientAndVehicleOrderByTotalDesc(
                eq(InvoiceStatus.PENDIENTE), eq(PageRequest.of(0, 10))))
                .thenReturn(List.of(inv));

        // Act
        DashboardFinancieroResponse result = dashboardService.getFinanciero(6);

        // Assert
        assertThat(result.topUnpaidInvoices()).hasSize(1);
        assertThat(result.topUnpaidInvoices().getFirst().total()).isEqualByComparingTo(new BigDecimal("5000"));
    }

    // --- getProductividad tests ---

    @Test
    void givenData_whenGetProductividad_thenReturnAllFields() {
        // Arrange
        when(repairOrderRepository.avgRepairDaysByStatusAndUpdatedAtBetween(
                eq(RepairOrderStatus.ENTREGADO), any(), any()))
                .thenReturn(new BigDecimal("3.5"));
        List<Object[]> mechanicData = new java.util.ArrayList<>();
        mechanicData.add(new Object[]{1L, "Juan Perez", 5L});
        when(repairOrderRepository.countCompletedByEmployee(eq(RepairOrderStatus.ENTREGADO), any(), any()))
                .thenReturn(mechanicData);
        List<Object[]> serviceData = new java.util.ArrayList<>();
        serviceData.add(new Object[]{"Cambio de aceite", 10L});
        when(invoiceRepository.findTopServiceNames(eq(InvoiceStatus.PAGADA), any(), any(), any()))
                .thenReturn(serviceData);

        // Act
        DashboardProductividadResponse result = dashboardService.getProductividad();

        // Assert
        assertThat(result.averageRepairDays()).isEqualByComparingTo(new BigDecimal("3.5"));
        assertThat(result.mechanicProductivity()).hasSize(1);
        assertThat(result.mechanicProductivity().getFirst().employeeFullName()).isEqualTo("Juan Perez");
        assertThat(result.topServices()).hasSize(1);
        assertThat(result.topServices().getFirst().serviceName()).isEqualTo("Cambio de aceite");
    }

    @Test
    void givenNoData_whenGetProductividad_thenReturnZeros() {
        // Arrange
        when(repairOrderRepository.avgRepairDaysByStatusAndUpdatedAtBetween(any(), any(), any()))
                .thenReturn(null);
        when(repairOrderRepository.countCompletedByEmployee(any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(invoiceRepository.findTopServiceNames(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        // Act
        DashboardProductividadResponse result = dashboardService.getProductividad();

        // Assert
        assertThat(result.averageRepairDays()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.mechanicProductivity()).isEmpty();
        assertThat(result.topServices()).isEmpty();
    }

    // --- Config tests ---

    @Test
    void givenExistingConfig_whenGetConfig_thenReturnConfig() {
        // Arrange
        DashboardConfig config = buildConfig();
        when(dashboardConfigRepository.findAll()).thenReturn(List.of(config));

        // Act
        DashboardConfig result = dashboardService.getConfig();

        // Assert
        assertThat(result.getStaleThresholdDays()).isEqualTo(5);
    }

    @Test
    void givenNoConfig_whenGetConfig_thenCreateDefault() {
        // Arrange
        DashboardConfig defaultConfig = buildConfig();
        when(dashboardConfigRepository.findAll()).thenReturn(Collections.emptyList());
        when(dashboardConfigRepository.save(any())).thenReturn(defaultConfig);

        // Act
        DashboardConfig result = dashboardService.getConfig();

        // Assert
        assertThat(result.getStaleThresholdDays()).isEqualTo(5);
        verify(dashboardConfigRepository).save(any());
    }

    @Test
    void givenValidRequest_whenUpdateConfig_thenReturnUpdated() {
        // Arrange
        DashboardConfig config = buildConfig();
        when(dashboardConfigRepository.findAll()).thenReturn(List.of(config));
        when(dashboardConfigRepository.save(config)).thenReturn(config);
        DashboardConfigRequest request = new DashboardConfigRequest(10);

        // Act
        DashboardConfig result = dashboardService.updateConfig(request);

        // Assert
        assertThat(result.getStaleThresholdDays()).isEqualTo(10);
        verify(dashboardConfigRepository).save(config);
    }

    // --- Helpers ---

    private DashboardConfig buildConfig() {
        DashboardConfig config = DashboardConfig.builder().staleThresholdDays(5).build();
        config.setId(1L);
        return config;
    }

    private RepairOrder buildRepairOrder(Long id, String title, RepairOrderStatus status) {
        Client client = Client.builder().firstName("Juan").lastName("Perez").build();
        client.setId(1L);
        Vehicle vehicle = Vehicle.builder().plate("ABC123").build();
        vehicle.setId(1L);
        RepairOrder ro = RepairOrder.builder()
                .title(title)
                .client(client)
                .vehicle(vehicle)
                .status(status)
                .build();
        ro.setId(id);
        ro.setUpdatedAt(LocalDateTime.now());
        ro.setCreatedAt(LocalDateTime.now());
        return ro;
    }

    private Estimate buildEstimate(Long id) {
        Client client = Client.builder().firstName("Maria").lastName("Garcia").build();
        client.setId(2L);
        Vehicle vehicle = Vehicle.builder().plate("XYZ789").build();
        vehicle.setId(2L);
        Estimate e = Estimate.builder()
                .client(client)
                .vehicle(vehicle)
                .status(EstimateStatus.PENDIENTE)
                .total(new BigDecimal("25000"))
                .build();
        e.setId(id);
        e.setCreatedAt(LocalDateTime.now());
        return e;
    }

    private Invoice buildInvoice(Long id, BigDecimal total) {
        Client client = Client.builder().firstName("Carlos").lastName("Lopez").build();
        client.setId(3L);
        Vehicle vehicle = Vehicle.builder().plate("DEF456").build();
        vehicle.setId(3L);
        Invoice inv = Invoice.builder()
                .client(client)
                .vehicle(vehicle)
                .total(total)
                .status(InvoiceStatus.PENDIENTE)
                .build();
        inv.setId(id);
        inv.setCreatedAt(LocalDateTime.now());
        return inv;
    }
}
