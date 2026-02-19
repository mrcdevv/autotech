package com.autotech.dashboard.service;

import com.autotech.dashboard.dto.DashboardFinancieroResponse;
import com.autotech.dashboard.dto.DashboardProductividadResponse;
import com.autotech.dashboard.dto.DebtAgingResponse;
import com.autotech.dashboard.dto.MechanicProductivityResponse;
import com.autotech.dashboard.dto.MonthlyRevenueResponse;
import com.autotech.dashboard.dto.TopServiceResponse;
import com.autotech.dashboard.dto.UnpaidInvoiceResponse;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardExportServiceImplTest {

    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private DashboardExportServiceImpl exportService;

    @Test
    void givenFinancieroData_whenExport_thenGenerateXlsxWithFourSheets() throws IOException {
        // Arrange
        DashboardFinancieroResponse data = new DashboardFinancieroResponse(
                List.of(new MonthlyRevenueResponse(2026, 1, new BigDecimal("50000"))),
                new BigDecimal("80"),
                8L, 10L,
                new BigDecimal("15000"),
                List.of(
                        new DebtAgingResponse("0-30", 2L, new BigDecimal("5000")),
                        new DebtAgingResponse("31-60", 1L, new BigDecimal("3000")),
                        new DebtAgingResponse("61-90", 0L, BigDecimal.ZERO),
                        new DebtAgingResponse("90+", 1L, new BigDecimal("2000"))),
                List.of(new UnpaidInvoiceResponse(1L, "Juan Perez", "ABC123",
                        new BigDecimal("5000"), LocalDateTime.of(2026, 1, 15, 10, 0))));
        when(dashboardService.getFinanciero(6)).thenReturn(data);

        // Act
        byte[] result = exportService.exportFinanciero(6);

        // Assert
        assertThat(result).isNotEmpty();
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            assertThat(workbook.getNumberOfSheets()).isEqualTo(4);
            assertThat(workbook.getSheetName(0)).isEqualTo("Ingresos Mensuales");
            assertThat(workbook.getSheetName(1)).isEqualTo("Antigüedad de Deuda");
            assertThat(workbook.getSheetName(2)).isEqualTo("Facturas Impagas");
            assertThat(workbook.getSheetName(3)).isEqualTo("Resumen Financiero");

            XSSFSheet revenueSheet = workbook.getSheetAt(0);
            assertThat(revenueSheet.getLastRowNum()).isEqualTo(1);
            assertThat(revenueSheet.getTables()).hasSize(1);
            assertThat(revenueSheet.getTables().getFirst().getStyleName()).isEqualTo("TableStyleMedium2");
        }
    }

    @Test
    void givenProductividadData_whenExport_thenGenerateXlsxWithTwoSheets() throws IOException {
        // Arrange
        DashboardProductividadResponse data = new DashboardProductividadResponse(
                new BigDecimal("3.5"),
                List.of(new MechanicProductivityResponse(1L, "Juan Perez", 5L)),
                List.of(new TopServiceResponse("Cambio de aceite", 10L)));
        when(dashboardService.getProductividad()).thenReturn(data);

        // Act
        byte[] result = exportService.exportProductividad();

        // Assert
        assertThat(result).isNotEmpty();
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            assertThat(workbook.getNumberOfSheets()).isEqualTo(2);
            assertThat(workbook.getSheetName(0)).isEqualTo("Productividad Mecánicos");
            assertThat(workbook.getSheetName(1)).isEqualTo("Servicios Más Facturados");

            XSSFSheet servicesSheet = workbook.getSheetAt(1);
            assertThat(servicesSheet.getLastRowNum()).isEqualTo(1);
            assertThat(servicesSheet.getTables()).hasSize(1);
        }
    }

    @Test
    void givenEmptyData_whenExportFinanciero_thenGenerateValidXlsx() throws IOException {
        // Arrange
        DashboardFinancieroResponse data = new DashboardFinancieroResponse(
                List.of(), BigDecimal.ZERO, 0L, 0L, BigDecimal.ZERO, List.of(), List.of());
        when(dashboardService.getFinanciero(6)).thenReturn(data);

        // Act
        byte[] result = exportService.exportFinanciero(6);

        // Assert
        assertThat(result).isNotEmpty();
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            assertThat(workbook.getNumberOfSheets()).isEqualTo(4);
        }
    }
}
