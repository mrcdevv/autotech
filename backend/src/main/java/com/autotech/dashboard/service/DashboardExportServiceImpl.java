package com.autotech.dashboard.service;

import com.autotech.dashboard.dto.BrandCountResponse;
import com.autotech.dashboard.dto.DashboardReportsResponse;
import com.autotech.dashboard.dto.DashboardFinancieroResponse;
import com.autotech.dashboard.dto.DashboardProductividadResponse;
import com.autotech.dashboard.dto.DebtAgingResponse;
import com.autotech.dashboard.dto.MechanicProductivityResponse;
import com.autotech.dashboard.dto.MonthlyBillingResponse;
import com.autotech.dashboard.dto.MonthlyRevenueResponse;
import com.autotech.dashboard.dto.ReportKpisResponse;
import com.autotech.dashboard.dto.ServiceStatsResponse;
import com.autotech.dashboard.dto.TopServiceResponse;
import com.autotech.dashboard.dto.UnpaidDeliveryNoteResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.SpreadsheetVersion;
import org.apache.poi.ss.util.AreaReference;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFTable;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardExportServiceImpl implements DashboardExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final DashboardService dashboardService;
    private final ReportService reportService;

    @Override
    public byte[] exportFinanciero(int months) {
        DashboardFinancieroResponse data = dashboardService.getFinanciero(months);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            createMonthlyRevenueSheet(workbook, data.monthlyRevenue());
            createDebtAgingSheet(workbook, data.debtAging());
            createUnpaidDeliveryNotesSheet(workbook, data.topUnpaidDeliveryNotes());
            createFinancieroSummarySheet(workbook, data);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Excel file", e);
        }
    }

    @Override
    public byte[] exportProductividad() {
        DashboardProductividadResponse data = dashboardService.getProductividad();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            createMechanicSheet(workbook, data.mechanicProductivity(), data.averageRepairDays());
            createTopServicesSheet(workbook, data.topServices());

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Excel file", e);
        }
    }

    @Override
    public byte[] exportReports(LocalDate from, LocalDate to) {
        DashboardReportsResponse data = reportService.getReports(from, to);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            createReportSummarySheet(workbook, data.kpis(), from, to);
            createMonthlyBillingSheet(workbook, data.monthlyBilling());
            createServiceStatsSheet(workbook, data.services());
            createBrandCountSheet(workbook, data.brandCounts());
            createDebtAgingSheet(workbook, data.debtAging());
            createUnpaidDeliveryNotesSheet(workbook, data.unpaidDeliveryNotes());

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Excel file", e);
        }
    }

    private void createReportSummarySheet(XSSFWorkbook workbook, ReportKpisResponse kpis,
                                          LocalDate from, LocalDate to) {
        String[] headers = {"Indicador", "Valor"};
        XSSFSheet sheet = workbook.createSheet("Resumen");
        XSSFCellStyle currencyStyle = createCurrencyStyle(workbook);
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        Object[][] rows = {
                {"Período", from.format(dayFormatter) + " al " + to.format(dayFormatter)},
                {"Facturado", kpis.totalBilled()},
                {"Cobrado", kpis.totalCollected()},
                {"Pendiente de cobro", kpis.totalPending()},
                {"Remitos emitidos", kpis.deliveryNoteCount()},
                {"Remitos pendientes", kpis.pendingDeliveryNoteCount()},
                {"Ticket promedio", kpis.averageTicket()},
                {"Presupuestos emitidos", kpis.estimatesTotal()},
                {"Presupuestos aceptados", kpis.estimatesAccepted()},
                {"Órdenes de trabajo", kpis.repairOrderCount()},
        };

        for (int i = 0; i < rows.length; i++) {
            XSSFRow row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue((String) rows[i][0]);
            var cell = row.createCell(1);
            Object value = rows[i][1];
            if (value instanceof BigDecimal amount) {
                cell.setCellValue(amount.doubleValue());
                cell.setCellStyle(currencyStyle);
            } else if (value instanceof Long count) {
                cell.setCellValue(count);
            } else {
                cell.setCellValue(value.toString());
            }
        }

        createTableInSheet(sheet, "Resumen", headers, rows.length);
    }

    private void createMonthlyBillingSheet(XSSFWorkbook workbook, List<MonthlyBillingResponse> data) {
        String[] headers = {"Año", "Mes", "Facturado", "Cobrado", "Pendiente"};
        XSSFSheet sheet = workbook.createSheet("Facturación Mensual");
        XSSFCellStyle currencyStyle = createCurrencyStyle(workbook);

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < data.size(); i++) {
            MonthlyBillingResponse item = data.get(i);
            XSSFRow row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(item.year());
            row.createCell(1).setCellValue(item.month());
            BigDecimal[] amounts = {item.billed(), item.collected(), item.billed().subtract(item.collected())};
            for (int j = 0; j < amounts.length; j++) {
                var cell = row.createCell(2 + j);
                cell.setCellValue(amounts[j].doubleValue());
                cell.setCellStyle(currencyStyle);
            }
        }

        createTableInSheet(sheet, "FacturacionMensual", headers, data.size());
    }

    private void createServiceStatsSheet(XSSFWorkbook workbook, List<ServiceStatsResponse> data) {
        String[] headers = {"Servicio", "Cantidad", "Ingresos"};
        XSSFSheet sheet = workbook.createSheet("Servicios");
        XSSFCellStyle currencyStyle = createCurrencyStyle(workbook);

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < data.size(); i++) {
            ServiceStatsResponse item = data.get(i);
            XSSFRow row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(item.serviceName());
            row.createCell(1).setCellValue(item.count());
            var cell = row.createCell(2);
            cell.setCellValue(item.totalRevenue().doubleValue());
            cell.setCellStyle(currencyStyle);
        }

        createTableInSheet(sheet, "Servicios", headers, data.size());
    }

    private void createBrandCountSheet(XSSFWorkbook workbook, List<BrandCountResponse> data) {
        String[] headers = {"Marca", "Órdenes"};
        XSSFSheet sheet = workbook.createSheet("Marcas");

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < data.size(); i++) {
            BrandCountResponse item = data.get(i);
            XSSFRow row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(item.brandName());
            row.createCell(1).setCellValue(item.count());
        }

        createTableInSheet(sheet, "Marcas", headers, data.size());
    }

    private void createMonthlyRevenueSheet(XSSFWorkbook workbook, List<MonthlyRevenueResponse> data) {
        String[] headers = {"Año", "Mes", "Total"};
        XSSFSheet sheet = workbook.createSheet("Ingresos Mensuales");
        XSSFCellStyle currencyStyle = createCurrencyStyle(workbook);

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < data.size(); i++) {
            MonthlyRevenueResponse item = data.get(i);
            XSSFRow row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(item.year());
            row.createCell(1).setCellValue(item.month());
            var cell = row.createCell(2);
            cell.setCellValue(item.total().doubleValue());
            cell.setCellStyle(currencyStyle);
        }

        createTableInSheet(sheet, "IngresosMensuales", headers, data.size());
    }

    private void createDebtAgingSheet(XSSFWorkbook workbook, List<DebtAgingResponse> data) {
        String[] headers = {"Rango", "Cantidad de Remitos", "Monto Total"};
        XSSFSheet sheet = workbook.createSheet("Antigüedad de Deuda");
        XSSFCellStyle currencyStyle = createCurrencyStyle(workbook);

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < data.size(); i++) {
            DebtAgingResponse item = data.get(i);
            XSSFRow row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(item.range() + " días");
            row.createCell(1).setCellValue(item.deliveryNoteCount());
            var cell = row.createCell(2);
            cell.setCellValue(item.totalAmount().doubleValue());
            cell.setCellStyle(currencyStyle);
        }

        createTableInSheet(sheet, "AntiguedadDeuda", headers, data.size());
    }

    private void createUnpaidDeliveryNotesSheet(XSSFWorkbook workbook, List<UnpaidDeliveryNoteResponse> data) {
        String[] headers = {"ID Remito", "Cliente", "Patente", "Total", "Fecha"};
        XSSFSheet sheet = workbook.createSheet("Remitos Impagos");
        XSSFCellStyle currencyStyle = createCurrencyStyle(workbook);

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < data.size(); i++) {
            UnpaidDeliveryNoteResponse item = data.get(i);
            XSSFRow row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(item.deliveryNoteId());
            row.createCell(1).setCellValue(item.clientFullName());
            row.createCell(2).setCellValue(item.vehiclePlate() != null ? item.vehiclePlate() : "");
            var cell = row.createCell(3);
            cell.setCellValue(item.total().doubleValue());
            cell.setCellStyle(currencyStyle);
            row.createCell(4).setCellValue(item.createdAt() != null ? item.createdAt().format(DATE_FORMATTER) : "");
        }

        createTableInSheet(sheet, "RemitosImpagos", headers, data.size());
    }

    private void createFinancieroSummarySheet(XSSFWorkbook workbook, DashboardFinancieroResponse data) {
        String[] headers = {"Indicador", "Valor"};
        XSSFSheet sheet = workbook.createSheet("Resumen Financiero");

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        XSSFRow row1 = sheet.createRow(1);
        row1.createCell(0).setCellValue("Tasa de conversión de presupuestos");
        row1.createCell(1).setCellValue(data.estimateConversionRate().doubleValue() + "%");

        XSSFRow row2 = sheet.createRow(2);
        row2.createCell(0).setCellValue("Presupuestos aceptados");
        row2.createCell(1).setCellValue(data.estimatesAccepted());

        XSSFRow row3 = sheet.createRow(3);
        row3.createCell(0).setCellValue("Total de presupuestos");
        row3.createCell(1).setCellValue(data.estimatesTotal());

        XSSFRow row4 = sheet.createRow(4);
        row4.createCell(0).setCellValue("Remitos pendientes totales");
        row4.createCell(1).setCellValue("$" + data.totalPendingBilling().toPlainString());

        createTableInSheet(sheet, "ResumenFinanciero", headers, 4);
    }

    private void createMechanicSheet(XSSFWorkbook workbook, List<MechanicProductivityResponse> data,
                                     BigDecimal avgRepairDays) {
        String[] headers = {"Mecánico", "Órdenes Completadas"};
        XSSFSheet sheet = workbook.createSheet("Productividad Mecánicos");

        XSSFRow infoRow = sheet.createRow(0);
        infoRow.createCell(0).setCellValue("Tiempo promedio de reparación (días): " + avgRepairDays.toPlainString());

        XSSFRow headerRow = sheet.createRow(2);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < data.size(); i++) {
            MechanicProductivityResponse item = data.get(i);
            XSSFRow row = sheet.createRow(i + 3);
            row.createCell(0).setCellValue(item.employeeFullName());
            row.createCell(1).setCellValue(item.completedOrders());
        }

        if (!data.isEmpty()) {
            int lastRow = 2 + data.size();
            int lastCol = headers.length - 1;
            AreaReference area = new AreaReference(
                    new CellReference(2, 0), new CellReference(lastRow, lastCol),
                    SpreadsheetVersion.EXCEL2007);
            XSSFTable table = sheet.createTable(area);
            table.setName("ProductividadMecanicos");
            table.setDisplayName("ProductividadMecanicos");
            table.setStyleName("TableStyleMedium2");
            for (int i = 0; i < headers.length; i++) {
                table.getCTTable().getTableColumns().getTableColumnArray(i).setName(headers[i]);
            }
        }

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createTopServicesSheet(XSSFWorkbook workbook, List<TopServiceResponse> data) {
        String[] headers = {"Servicio", "Cantidad"};
        XSSFSheet sheet = workbook.createSheet("Servicios Más Remitidos");

        XSSFRow headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < data.size(); i++) {
            TopServiceResponse item = data.get(i);
            XSSFRow row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(item.serviceName());
            row.createCell(1).setCellValue(item.count());
        }

        createTableInSheet(sheet, "ServiciosMasRemitidos", headers, data.size());
    }

    private void createTableInSheet(XSSFSheet sheet, String tableName,
                                    String[] headers, int dataRowCount) {
        if (dataRowCount == 0) {
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            return;
        }

        int lastRow = dataRowCount;
        int lastCol = headers.length - 1;
        AreaReference area = new AreaReference(
                new CellReference(0, 0), new CellReference(lastRow, lastCol),
                SpreadsheetVersion.EXCEL2007);

        XSSFTable table = sheet.createTable(area);
        table.setName(tableName);
        table.setDisplayName(tableName);
        table.setStyleName("TableStyleMedium2");

        for (int i = 0; i < headers.length; i++) {
            table.getCTTable().getTableColumns().getTableColumnArray(i).setName(headers[i]);
        }

        for (int i = 0; i <= lastCol; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private XSSFCellStyle createCurrencyStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat("$#,##0.00"));
        return style;
    }
}
