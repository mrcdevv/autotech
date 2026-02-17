# 12v2 — Dashboard / Inicio (Enhanced)

## 1. Overview

This spec **replaces** the original spec 12 and defines an enhanced Dashboard (Inicio) — the home page of Autotech. It is a **read-only** feature that displays key performance indicators (KPIs), charts, alerts, and summary data for the workshop. It also provides **Excel export** (via Apache POI on the backend) for each section.

The page has two visual zones:

1. **Fixed top section** (always visible, no scroll needed): KPI cards + today's appointments + alerts. This answers "how is the workshop doing RIGHT NOW?".
2. **Tabbed bottom section**: two tabs — **Financiero** and **Productividad** — that provide deeper analysis with charts and tables.

Each tab has its own "Exportar a Excel" button that generates a `.xlsx` file with formatted tables for that section's data.

### Fixed Top Section

| # | Element | Description |
|---|---|---|
| 1 | **Open repair order count** | Total non-`ENTREGADO` repair orders (vehicles currently in the workshop). |
| 2 | **Today's appointments count** | Appointments where `start_time` falls within today. |
| 3 | **Monthly revenue** | Sum of `invoices.total` where `status = 'PAGADA'` and `created_at` in current month (**admin only**). |
| 4 | **Average ticket** | Mean of `invoices.total` for `PAGADA` invoices in the current month (**admin only**). |
| 5 | **Repair order status breakdown** | Horizontal bar or chip-style breakdown showing count per status. |
| 6 | **Today's appointments list** | Next 5 appointments for today (time, client name, vehicle plate, purpose). |
| 7 | **Stale order alerts** | Repair orders that haven't changed status in N days (N is configurable in Settings). |
| 8 | **Pending estimate alerts** | Estimates with status `PENDIENTE` older than N days (same configurable threshold). |

### Tab: Financiero (admin only)

| # | Element | Description |
|---|---|---|
| 1 | **Monthly revenue chart** | Bar chart showing monthly revenue for the last N months (default 6, user can toggle to 12). |
| 2 | **Estimate conversion rate** | Percentage of estimates with status `ACEPTADO` vs total estimates (current month). |
| 3 | **Pending billing total** | Sum of `invoices.total` where `status = 'PENDIENTE'`. |
| 4 | **Debt aging breakdown** | Table showing unpaid invoices grouped by age: 0-30 days, 30-60 days, 60-90 days, 90+ days. |
| 5 | **Top unpaid invoices** | List of top 10 invoices with `status = 'PENDIENTE'`, ordered by `total DESC`. |
| 6 | **Export button** | Exports Financiero data to Excel (.xlsx) with formatted tables. |

### Tab: Productividad

| # | Element | Description |
|---|---|---|
| 1 | **Average repair time** | Mean days from `created_at` to `updated_at` of repair orders that reached `ENTREGADO` in the current month. |
| 2 | **Completed orders by mechanic** | Table: employee name + count of repair orders they're assigned to that reached `ENTREGADO` this month. |
| 3 | **Top services** | Top 10 most frequently billed service names from `invoice_services`, aggregated by count (current month). |
| 4 | **Export button** | Exports Productividad data to Excel (.xlsx) with formatted tables. |

> **Note**: Items marked "admin only" will be conditionally rendered when authentication (spec 13) is implemented. For now, everything is visible.

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/dashboard-v2` |
| Base | `develop` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add dashboard config entity and migration`
- `feat: add enhanced DashboardService with all aggregation queries`
- `feat: add DashboardExportService with Apache POI Excel generation`
- `feat: add DashboardController with summary and export endpoints`
- `feat: add DashboardPage with fixed section and tabbed layout`
- `feat: add FinancieroTab with revenue chart and debt aging`
- `feat: add ProductividadTab with repair time and mechanic stats`
- `feat: add DashboardSettingsTab to SettingsPage`
- `chore: add @mui/x-charts and Apache POI dependencies`
- `test: add unit tests for DashboardService`
- `test: add unit tests for DashboardExportService`

---

## 3. DB Tables

### 3.1 New Table: `dashboard_config`

A **singleton** configuration table (always 1 row, similar to `calendar_config`).

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `stale_threshold_days` | `INTEGER` | NOT NULL, DEFAULT 5 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

> `stale_threshold_days` defines how many days without a status change marks a repair order (or pending estimate) as "stale". Configurable from SettingsPage > Dashboard tab.

### 3.2 Migration

File: `V2__add_dashboard_config.sql`

```sql
CREATE TABLE dashboard_config (
    id                      BIGSERIAL PRIMARY KEY,
    stale_threshold_days    INTEGER NOT NULL DEFAULT 5,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO dashboard_config (stale_threshold_days) VALUES (5);
```

### 3.3 Referenced Tables (read-only)

| Table | Purpose |
|---|---|
| `repair_orders` | Open count, status breakdown, stale alerts, avg repair time, completed by mechanic |
| `repair_order_employees` | Completed orders by mechanic join |
| `appointments` | Today's count, today's appointment list |
| `invoices` | Monthly revenue, average ticket, pending billing, debt aging, top unpaid |
| `invoice_services` | Top services aggregation |
| `estimates` | Conversion rate, pending estimate alerts |
| `clients` | Client names for appointments/invoices |
| `vehicles` | Vehicle plates for appointments/invoices |
| `employees` | Mechanic names for productivity |

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.dashboard/
├── controller/
│   └── DashboardController.java
├── service/
│   ├── DashboardService.java               (interface)
│   ├── DashboardServiceImpl.java           (implementation)
│   ├── DashboardExportService.java         (interface)
│   └── DashboardExportServiceImpl.java     (Excel generation with Apache POI)
├── dto/
│   ├── DashboardSummaryResponse.java       (top section KPIs)
│   ├── DashboardFinancieroResponse.java    (Financiero tab data)
│   ├── DashboardProductividadResponse.java (Productividad tab data)
│   ├── StatusCountResponse.java
│   ├── TodayAppointmentResponse.java
│   ├── StaleOrderAlertResponse.java
│   ├── PendingEstimateAlertResponse.java
│   ├── MonthlyRevenueResponse.java
│   ├── DebtAgingResponse.java
│   ├── UnpaidInvoiceResponse.java
│   ├── MechanicProductivityResponse.java
│   ├── TopServiceResponse.java
│   └── DashboardConfigRequest.java
├── model/
│   └── DashboardConfig.java
└── repository/
    └── DashboardConfigRepository.java
```

### 4.2 Entity — `DashboardConfig`

Location: `com.autotech.dashboard.model`

```java
@Entity
@Table(name = "dashboard_config")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DashboardConfig extends BaseEntity {

    @Column(name = "stale_threshold_days", nullable = false)
    @Builder.Default
    private Integer staleThresholdDays = 5;
}
```

### 4.3 Repository — `DashboardConfigRepository`

```java
@Repository
public interface DashboardConfigRepository extends JpaRepository<DashboardConfig, Long> {
}
```

### 4.4 DTOs

Location: `com.autotech.dashboard.dto`

#### `DashboardSummaryResponse` (replaces old one — top section)

```java
public record DashboardSummaryResponse(
    Long openRepairOrderCount,
    Long todayAppointmentCount,
    BigDecimal monthlyRevenue,
    BigDecimal averageTicket,
    List<StatusCountResponse> repairOrderStatusCounts,
    List<TodayAppointmentResponse> todayAppointments,
    List<StaleOrderAlertResponse> staleOrderAlerts,
    List<PendingEstimateAlertResponse> pendingEstimateAlerts,
    Integer staleThresholdDays
) {}
```

#### `StatusCountResponse` (unchanged)

```java
public record StatusCountResponse(
    String status,
    Long count
) {}
```

#### `TodayAppointmentResponse`

```java
public record TodayAppointmentResponse(
    Long appointmentId,
    LocalDateTime startTime,
    String clientFullName,
    String vehiclePlate,
    String purpose
) {}
```

#### `StaleOrderAlertResponse`

```java
public record StaleOrderAlertResponse(
    Long repairOrderId,
    String title,
    String clientFullName,
    String vehiclePlate,
    String status,
    Long daysSinceLastUpdate
) {}
```

#### `PendingEstimateAlertResponse`

```java
public record PendingEstimateAlertResponse(
    Long estimateId,
    String clientFullName,
    String vehiclePlate,
    BigDecimal total,
    Long daysPending
) {}
```

#### `DashboardFinancieroResponse` (Financiero tab)

```java
public record DashboardFinancieroResponse(
    List<MonthlyRevenueResponse> monthlyRevenue,
    BigDecimal estimateConversionRate,
    Long estimatesAccepted,
    Long estimatesTotal,
    BigDecimal totalPendingBilling,
    List<DebtAgingResponse> debtAging,
    List<UnpaidInvoiceResponse> topUnpaidInvoices
) {}
```

#### `MonthlyRevenueResponse`

```java
public record MonthlyRevenueResponse(
    Integer year,
    Integer month,
    BigDecimal total
) {}
```

#### `DebtAgingResponse`

```java
public record DebtAgingResponse(
    String range,
    Long invoiceCount,
    BigDecimal totalAmount
) {}
```

> Ranges: `"0-30"`, `"31-60"`, `"61-90"`, `"90+"`

#### `UnpaidInvoiceResponse` (unchanged)

```java
public record UnpaidInvoiceResponse(
    Long invoiceId,
    String clientFullName,
    String vehiclePlate,
    BigDecimal total,
    LocalDateTime createdAt
) {}
```

#### `DashboardProductividadResponse` (Productividad tab)

```java
public record DashboardProductividadResponse(
    BigDecimal averageRepairDays,
    List<MechanicProductivityResponse> mechanicProductivity,
    List<TopServiceResponse> topServices
) {}
```

#### `MechanicProductivityResponse`

```java
public record MechanicProductivityResponse(
    Long employeeId,
    String employeeFullName,
    Long completedOrders
) {}
```

#### `TopServiceResponse`

```java
public record TopServiceResponse(
    String serviceName,
    Long count
) {}
```

#### `DashboardConfigRequest`

```java
public record DashboardConfigRequest(
    @NotNull @Min(1) @Max(90) Integer staleThresholdDays
) {}
```

### 4.5 Service — `DashboardService`

```java
public interface DashboardService {

    DashboardSummaryResponse getSummary();

    DashboardFinancieroResponse getFinanciero(int months);

    DashboardProductividadResponse getProductividad();

    DashboardConfig getConfig();

    DashboardConfig updateConfig(DashboardConfigRequest request);
}
```

#### `DashboardServiceImpl`

```java
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

        // 1. Open repair order count
        Long openOrderCount = repairOrderRepository.countByStatusNot(RepairOrderStatus.ENTREGADO);

        // 2. Today's appointment count
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        Long todayAppointmentCount = appointmentRepository.countByStartTimeBetween(todayStart, todayEnd);

        // 3. Monthly revenue
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        BigDecimal monthlyRevenue = invoiceRepository.sumTotalByStatusAndCreatedAtBetween(
            InvoiceStatus.PAGADA, monthStart, monthEnd);
        if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;

        // 4. Average ticket (paid invoices this month)
        BigDecimal averageTicket = invoiceRepository.avgTotalByStatusAndCreatedAtBetween(
            InvoiceStatus.PAGADA, monthStart, monthEnd);
        if (averageTicket == null) averageTicket = BigDecimal.ZERO;

        // 5. Status breakdown
        List<StatusCountResponse> statusCounts = repairOrderRepository.countGroupByStatus().stream()
            .map(row -> new StatusCountResponse(
                ((RepairOrderStatus) row[0]).name(), (Long) row[1]))
            .toList();

        // 6. Today's appointments (next 5)
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

        // 7. Stale order alerts
        LocalDateTime staleThreshold = LocalDateTime.now().minusDays(config.getStaleThresholdDays());
        List<StaleOrderAlertResponse> staleAlerts = repairOrderRepository
            .findStaleOrders(staleThreshold, RepairOrderStatus.ENTREGADO).stream()
            .map(ro -> new StaleOrderAlertResponse(
                ro.getId(),
                ro.getTitle(),
                ro.getClient().getFirstName() + " " + ro.getClient().getLastName(),
                ro.getVehicle().getPlate(),
                ro.getStatus().name(),
                java.time.Duration.between(ro.getUpdatedAt(), LocalDateTime.now()).toDays()))
            .toList();

        // 8. Pending estimate alerts
        List<PendingEstimateAlertResponse> pendingEstimates = estimateRepository
            .findPendingOlderThan(EstimateStatus.PENDIENTE, staleThreshold).stream()
            .map(e -> new PendingEstimateAlertResponse(
                e.getId(),
                e.getClient().getFirstName() + " " + e.getClient().getLastName(),
                e.getVehicle().getPlate(),
                e.getTotal(),
                java.time.Duration.between(e.getCreatedAt(), LocalDateTime.now()).toDays()))
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

        // 1. Monthly revenue for last N months
        LocalDateTime rangeStart = LocalDate.now().minusMonths(months - 1).withDayOfMonth(1).atStartOfDay();
        List<MonthlyRevenueResponse> monthlyRevenue = invoiceRepository
            .sumTotalByStatusGroupByMonth(InvoiceStatus.PAGADA, rangeStart, now).stream()
            .map(row -> new MonthlyRevenueResponse((Integer) row[0], (Integer) row[1], (BigDecimal) row[2]))
            .toList();

        // 2. Estimate conversion rate (current month)
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        Long accepted = estimateRepository.countByStatusAndCreatedAtBetween(
            EstimateStatus.ACEPTADO, monthStart, monthEnd);
        Long totalEstimates = estimateRepository.countByCreatedAtBetween(monthStart, monthEnd);
        BigDecimal conversionRate = totalEstimates > 0
            ? BigDecimal.valueOf(accepted).divide(BigDecimal.valueOf(totalEstimates), 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        // 3. Pending billing
        BigDecimal totalPendingBilling = invoiceRepository.sumTotalByStatus(InvoiceStatus.PENDIENTE);
        if (totalPendingBilling == null) totalPendingBilling = BigDecimal.ZERO;

        // 4. Debt aging
        List<DebtAgingResponse> debtAging = calculateDebtAging();

        // 5. Top unpaid invoices (limit 10)
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

        // 1. Average repair time (days) for orders completed this month
        BigDecimal avgRepairDays = repairOrderRepository.avgRepairDaysByStatusAndUpdatedAtBetween(
            RepairOrderStatus.ENTREGADO, monthStart, monthEnd);
        if (avgRepairDays == null) avgRepairDays = BigDecimal.ZERO;

        // 2. Completed orders by mechanic this month
        List<MechanicProductivityResponse> mechanics = repairOrderRepository
            .countCompletedByEmployee(RepairOrderStatus.ENTREGADO, monthStart, monthEnd).stream()
            .map(row -> new MechanicProductivityResponse((Long) row[0], (String) row[1], (Long) row[2]))
            .toList();

        // 3. Top services this month (from invoice_services)
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

        // 4 separate queries for each range
        Object[] r0_30 = invoiceRepository.countAndSumByStatusAndCreatedAtBetween(InvoiceStatus.PENDIENTE, d30, now);
        Object[] r31_60 = invoiceRepository.countAndSumByStatusAndCreatedAtBetween(InvoiceStatus.PENDIENTE, d60, d30);
        Object[] r61_90 = invoiceRepository.countAndSumByStatusAndCreatedAtBetween(InvoiceStatus.PENDIENTE, d90, d60);
        Object[] r90plus = invoiceRepository.countAndSumByStatusAndCreatedAtBefore(InvoiceStatus.PENDIENTE, d90);

        return List.of(
            new DebtAgingResponse("0-30", toLong(r0_30[0]), toBigDecimal(r0_30[1])),
            new DebtAgingResponse("31-60", toLong(r31_60[0]), toBigDecimal(r31_60[1])),
            new DebtAgingResponse("61-90", toLong(r61_90[0]), toBigDecimal(r61_90[1])),
            new DebtAgingResponse("90+", toLong(r90plus[0]), toBigDecimal(r90plus[1]))
        );
    }

    private Long toLong(Object val) { return val != null ? (Long) val : 0L; }
    private BigDecimal toBigDecimal(Object val) { return val != null ? (BigDecimal) val : BigDecimal.ZERO; }
}
```

### 4.6 Service — `DashboardExportService`

```java
public interface DashboardExportService {

    byte[] exportFinanciero(int months);

    byte[] exportProductividad();
}
```

#### `DashboardExportServiceImpl`

Generates `.xlsx` files using Apache POI with **formatted table styles** (XSSFTable with `TableStyleMedium2`).

```java
@Service
@RequiredArgsConstructor
public class DashboardExportServiceImpl implements DashboardExportService {

    private final DashboardService dashboardService;

    @Override
    public byte[] exportFinanciero(int months) {
        DashboardFinancieroResponse data = dashboardService.getFinanciero(months);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // Sheet 1: Monthly Revenue
            createMonthlyRevenueSheet(workbook, data.monthlyRevenue());

            // Sheet 2: Debt Aging
            createDebtAgingSheet(workbook, data.debtAging());

            // Sheet 3: Top Unpaid Invoices
            createUnpaidInvoicesSheet(workbook, data.topUnpaidInvoices());

            // Sheet 4: Summary (conversion rate, pending billing)
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
            // Sheet 1: Mechanic Productivity
            createMechanicSheet(workbook, data.mechanicProductivity(), data.averageRepairDays());

            // Sheet 2: Top Services
            createTopServicesSheet(workbook, data.topServices());

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Excel file", e);
        }
    }

    // --- Private helper methods ---
    // Each method creates an XSSFSheet, writes header row + data rows,
    // then wraps the range in an XSSFTable with TableStyleMedium2.
    // Currency columns use a CellStyle with format "$#,##0.00".
    // Columns auto-size after data is written.

    private void createTableInSheet(XSSFSheet sheet, String tableName,
                                     String[] headers, int dataRowCount) {
        int lastRow = dataRowCount; // 0-based: row 0 = header, rows 1..dataRowCount = data
        int lastCol = headers.length - 1;
        AreaReference area = new AreaReference(
            new CellReference(0, 0), new CellReference(lastRow, lastCol),
            SpreadsheetVersion.EXCEL2007);

        XSSFTable table = sheet.createTable(area);
        table.setName(tableName);
        table.setDisplayName(tableName);
        table.setStyleName("TableStyleMedium2");
        table.getCTTable().getAutoFilter();

        // Set column names from headers
        for (int i = 0; i < headers.length; i++) {
            table.getCTTable().getTableColumns().getTableColumnArray(i).setName(headers[i]);
        }

        // Auto-size columns
        for (int i = 0; i <= lastCol; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    // Example: createMonthlyRevenueSheet, createDebtAgingSheet, etc.
    // All follow the same pattern:
    //   1. Create sheet
    //   2. Write header row (row 0)
    //   3. Write data rows (rows 1..N)
    //   4. Apply currency CellStyle where needed
    //   5. Call createTableInSheet()
}
```

> **Implementation note**: The helper methods (`createMonthlyRevenueSheet`, `createDebtAgingSheet`, `createUnpaidInvoicesSheet`, `createFinancieroSummarySheet`, `createMechanicSheet`, `createTopServicesSheet`) all follow the same pattern. Each creates a sheet, writes header + data rows, applies formatting, and wraps in an `XSSFTable`. The exact implementation is left to the developer but must use `TableStyleMedium2` and auto-sized columns.

### 4.7 Additional Repository Methods

#### `RepairOrderRepository` (additions)

```java
@Query("""
    SELECT ro FROM RepairOrder ro
    JOIN FETCH ro.client JOIN FETCH ro.vehicle
    WHERE ro.updatedAt < :threshold AND ro.status <> :excludedStatus
    ORDER BY ro.updatedAt ASC
    """)
List<RepairOrder> findStaleOrders(
    @Param("threshold") LocalDateTime threshold,
    @Param("excludedStatus") RepairOrderStatus excludedStatus);

@Query(value = """
    SELECT AVG(EXTRACT(EPOCH FROM (ro.updated_at - ro.created_at)) / 86400)
    FROM repair_orders ro
    WHERE ro.status = :#{#status.name()} AND ro.updated_at >= :start AND ro.updated_at < :end
    """, nativeQuery = true)
BigDecimal avgRepairDaysByStatusAndUpdatedAtBetween(
    @Param("status") RepairOrderStatus status,
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end);

@Query("""
    SELECT e.id, CONCAT(e.firstName, ' ', e.lastName), COUNT(ro)
    FROM RepairOrder ro JOIN ro.employees e
    WHERE ro.status = :status AND ro.updatedAt >= :start AND ro.updatedAt < :end
    GROUP BY e.id, e.firstName, e.lastName
    ORDER BY COUNT(ro) DESC
    """)
List<Object[]> countCompletedByEmployee(
    @Param("status") RepairOrderStatus status,
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end);
```

#### `AppointmentRepository` (no additions — `findByDateRange` already exists)

#### `InvoiceRepository` (additions)

```java
@Query("SELECT AVG(i.total) FROM Invoice i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
BigDecimal avgTotalByStatusAndCreatedAtBetween(
    @Param("status") InvoiceStatus status,
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end);

@Query("""
    SELECT YEAR(i.createdAt), MONTH(i.createdAt), COALESCE(SUM(i.total), 0)
    FROM Invoice i
    WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end
    GROUP BY YEAR(i.createdAt), MONTH(i.createdAt)
    ORDER BY YEAR(i.createdAt), MONTH(i.createdAt)
    """)
List<Object[]> sumTotalByStatusGroupByMonth(
    @Param("status") InvoiceStatus status,
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end);

@Query("SELECT COUNT(i), COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
Object[] countAndSumByStatusAndCreatedAtBetween(
    @Param("status") InvoiceStatus status,
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end);

@Query("SELECT COUNT(i), COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = :status AND i.createdAt < :before")
Object[] countAndSumByStatusAndCreatedAtBefore(
    @Param("status") InvoiceStatus status,
    @Param("before") LocalDateTime before);

@Query("""
    SELECT s.serviceName, COUNT(s)
    FROM Invoice i JOIN i.services s
    WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end
    GROUP BY s.serviceName
    ORDER BY COUNT(s) DESC
    """)
List<Object[]> findTopServiceNames(
    @Param("status") InvoiceStatus status,
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end,
    Pageable pageable);
```

#### `EstimateRepository` (additions)

```java
Long countByStatusAndCreatedAtBetween(EstimateStatus status, LocalDateTime start, LocalDateTime end);

Long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

@Query("""
    SELECT e FROM Estimate e
    JOIN FETCH e.client JOIN FETCH e.vehicle
    WHERE e.status = :status AND e.createdAt < :threshold
    ORDER BY e.createdAt ASC
    """)
List<Estimate> findPendingOlderThan(
    @Param("status") EstimateStatus status,
    @Param("threshold") LocalDateTime threshold);
```

### 4.8 Controller — `DashboardController`

Location: `com.autotech.dashboard.controller.DashboardController`

Base path: `/api/dashboard`

```java
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final DashboardExportService dashboardExportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getSummary()));
    }

    @GetMapping("/financiero")
    public ResponseEntity<ApiResponse<DashboardFinancieroResponse>> getFinanciero(
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getFinanciero(months)));
    }

    @GetMapping("/productividad")
    public ResponseEntity<ApiResponse<DashboardProductividadResponse>> getProductividad() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getProductividad()));
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<DashboardConfigResponse>> getConfig() {
        DashboardConfig config = dashboardService.getConfig();
        return ResponseEntity.ok(ApiResponse.success(
            new DashboardConfigResponse(config.getStaleThresholdDays())));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<DashboardConfigResponse>> updateConfig(
            @Valid @RequestBody DashboardConfigRequest request) {
        DashboardConfig config = dashboardService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.success(
            new DashboardConfigResponse(config.getStaleThresholdDays())));
    }

    @GetMapping("/export/financiero")
    public ResponseEntity<byte[]> exportFinanciero(
            @RequestParam(defaultValue = "6") int months) {
        byte[] file = dashboardExportService.exportFinanciero(months);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=dashboard_financiero.xlsx")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(file);
    }

    @GetMapping("/export/productividad")
    public ResponseEntity<byte[]> exportProductividad() {
        byte[] file = dashboardExportService.exportProductividad();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=dashboard_productividad.xlsx")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(file);
    }
}
```

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Top section: KPIs, today's appointments, alerts |
| `GET` | `/api/dashboard/financiero?months=6` | Financiero tab data (default 6 months) |
| `GET` | `/api/dashboard/productividad` | Productividad tab data |
| `GET` | `/api/dashboard/config` | Get dashboard config (stale threshold) |
| `PUT` | `/api/dashboard/config` | Update dashboard config |
| `GET` | `/api/dashboard/export/financiero?months=6` | Download Financiero Excel |
| `GET` | `/api/dashboard/export/productividad` | Download Productividad Excel |

### 4.9 New Dependency — Apache POI

Add to `pom.xml`:

```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.3.0</version>
</dependency>
```

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   └── dashboard.ts                    (updated)
├── features/
│   └── dashboard/
│       ├── components/
│       │   ├── KpiCard.tsx             (keep existing)
│       │   ├── StatusBreakdownCard.tsx  (keep existing)
│       │   ├── TodayAppointmentsList.tsx
│       │   ├── StaleOrderAlerts.tsx
│       │   ├── PendingEstimateAlerts.tsx
│       │   ├── MonthlyRevenueChart.tsx
│       │   ├── DebtAgingTable.tsx
│       │   ├── TopUnpaidInvoicesList.tsx (keep existing)
│       │   ├── MechanicProductivityTable.tsx
│       │   ├── TopServicesTable.tsx
│       │   ├── FinancieroTab.tsx
│       │   └── ProductividadTab.tsx
│       ├── hooks/
│       │   ├── useDashboard.ts         (updated)
│       │   ├── useFinanciero.ts
│       │   └── useProductividad.ts
│       └── types.ts                    (updated)
├── features/
│   └── settings/
│       └── components/
│           └── DashboardSettingsTab.tsx (new)
├── pages/
│   ├── DashboardPage.tsx               (updated)
│   └── SettingsPage.tsx                (updated — add 5th tab)
└── utils/
    └── formatCurrency.ts               (keep existing)
```

### 5.2 Types

Location: `src/features/dashboard/types.ts`

```typescript
// --- Top Section ---

interface StatusCountResponse {
  status: string;
  count: number;
}

interface TodayAppointmentResponse {
  appointmentId: number;
  startTime: string;
  clientFullName: string | null;
  vehiclePlate: string | null;
  purpose: string | null;
}

interface StaleOrderAlertResponse {
  repairOrderId: number;
  title: string | null;
  clientFullName: string;
  vehiclePlate: string;
  status: string;
  daysSinceLastUpdate: number;
}

interface PendingEstimateAlertResponse {
  estimateId: number;
  clientFullName: string;
  vehiclePlate: string;
  total: number;
  daysPending: number;
}

interface DashboardSummaryResponse {
  openRepairOrderCount: number;
  todayAppointmentCount: number;
  monthlyRevenue: number;
  averageTicket: number;
  repairOrderStatusCounts: StatusCountResponse[];
  todayAppointments: TodayAppointmentResponse[];
  staleOrderAlerts: StaleOrderAlertResponse[];
  pendingEstimateAlerts: PendingEstimateAlertResponse[];
  staleThresholdDays: number;
}

// --- Financiero Tab ---

interface MonthlyRevenueResponse {
  year: number;
  month: number;
  total: number;
}

interface DebtAgingResponse {
  range: string;
  invoiceCount: number;
  totalAmount: number;
}

interface UnpaidInvoiceResponse {
  invoiceId: number;
  clientFullName: string;
  vehiclePlate: string | null;
  total: number;
  createdAt: string;
}

interface DashboardFinancieroResponse {
  monthlyRevenue: MonthlyRevenueResponse[];
  estimateConversionRate: number;
  estimatesAccepted: number;
  estimatesTotal: number;
  totalPendingBilling: number;
  debtAging: DebtAgingResponse[];
  topUnpaidInvoices: UnpaidInvoiceResponse[];
}

// --- Productividad Tab ---

interface MechanicProductivityResponse {
  employeeId: number;
  employeeFullName: string;
  completedOrders: number;
}

interface TopServiceResponse {
  serviceName: string;
  count: number;
}

interface DashboardProductividadResponse {
  averageRepairDays: number;
  mechanicProductivity: MechanicProductivityResponse[];
  topServices: TopServiceResponse[];
}

// --- Config ---

interface DashboardConfigResponse {
  staleThresholdDays: number;
}

interface DashboardConfigRequest {
  staleThresholdDays: number;
}
```

### 5.3 API

Location: `src/api/dashboard.ts`

```typescript
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  DashboardSummaryResponse,
  DashboardFinancieroResponse,
  DashboardProductividadResponse,
  DashboardConfigResponse,
  DashboardConfigRequest,
} from "@/features/dashboard/types";

export const dashboardApi = {
  getSummary: () =>
    apiClient.get<ApiResponse<DashboardSummaryResponse>>("/dashboard/summary"),

  getFinanciero: (months: number = 6) =>
    apiClient.get<ApiResponse<DashboardFinancieroResponse>>(
      `/dashboard/financiero?months=${months}`),

  getProductividad: () =>
    apiClient.get<ApiResponse<DashboardProductividadResponse>>(
      "/dashboard/productividad"),

  getConfig: () =>
    apiClient.get<ApiResponse<DashboardConfigResponse>>("/dashboard/config"),

  updateConfig: (data: DashboardConfigRequest) =>
    apiClient.put<ApiResponse<DashboardConfigResponse>>("/dashboard/config", data),

  exportFinanciero: (months: number = 6) =>
    apiClient.get<Blob>(`/dashboard/export/financiero?months=${months}`, {
      responseType: "blob",
    }),

  exportProductividad: () =>
    apiClient.get<Blob>("/dashboard/export/productividad", {
      responseType: "blob",
    }),
};
```

### 5.4 Hooks

#### `useDashboard.ts` (updated)

Same pattern as before but now returns the enhanced `DashboardSummaryResponse` with appointments, alerts, etc.

#### `useFinanciero.ts`

```typescript
export function useFinanciero(months: number = 6) {
  const [data, setData] = useState<DashboardFinancieroResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getFinanciero(months);
      setData(res.data.data);
    } catch {
      setError("Error al cargar los datos financieros");
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportToExcel = useCallback(async () => {
    try {
      const res = await dashboardApi.exportFinanciero(months);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "dashboard_financiero.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Error al exportar a Excel");
    }
  }, [months]);

  return { data, loading, error, refetch: fetchData, exportToExcel };
}
```

#### `useProductividad.ts`

Same pattern as `useFinanciero`, but calls `getProductividad()` and `exportProductividad()`.

### 5.5 Pages

#### `DashboardPage` (updated)

```tsx
export default function DashboardPage() {
  const { summary, loading, error } = useDashboard();
  const [activeTab, setActiveTab] = useState(0);

  if (loading) return <CircularProgress centered />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!summary) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Inicio</Typography>

      {/* === FIXED TOP SECTION === */}

      {/* KPI Cards Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Órdenes abiertas" value={summary.openRepairOrderCount} icon={<BuildIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Citas de hoy" value={summary.todayAppointmentCount} icon={<EventIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Facturación del mes" value={formatCurrency(summary.monthlyRevenue)} icon={<TrendingUpIcon />} adminOnly />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Ticket promedio" value={formatCurrency(summary.averageTicket)} icon={<ReceiptIcon />} adminOnly />
        </Grid>
      </Grid>

      {/* Status Breakdown + Today's Appointments + Alerts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatusBreakdownCard statusCounts={summary.repairOrderStatusCounts} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TodayAppointmentsList appointments={summary.todayAppointments} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StaleOrderAlerts alerts={summary.staleOrderAlerts} thresholdDays={summary.staleThresholdDays} />
          <PendingEstimateAlerts alerts={summary.pendingEstimateAlerts} thresholdDays={summary.staleThresholdDays} />
        </Grid>
      </Grid>

      {/* === TABBED BOTTOM SECTION === */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Financiero" />
        <Tab label="Productividad" />
      </Tabs>

      {activeTab === 0 && <FinancieroTab />}
      {activeTab === 1 && <ProductividadTab />}
    </Box>
  );
}
```

### 5.6 Components

#### `TodayAppointmentsList`

Card showing next 5 appointments for today: time (HH:mm), client name, vehicle plate, purpose.

#### `StaleOrderAlerts`

Card with `Alert` severity `"warning"`. Each alert shows: order title, client, plate, status, and "X días sin actualización".

#### `PendingEstimateAlerts`

Card with `Alert` severity `"info"`. Each alert shows: client, plate, total, and "X días pendiente".

#### `MonthlyRevenueChart`

Uses `@mui/x-charts` `BarChart` component. X-axis = month labels ("Ene", "Feb", ...), Y-axis = revenue. Has a toggle (6 months / 12 months) that re-fetches data.

#### `DebtAgingTable`

Simple MUI `Table` (not DataGrid) with 3 columns: Range, Invoice Count, Total Amount. 4 rows: 0-30, 31-60, 61-90, 90+.

#### `MechanicProductivityTable`

MUI `Table` with columns: Mechanic, Completed Orders. Sorted by count DESC.

#### `TopServicesTable`

MUI `Table` with columns: Service Name, Times Billed. Sorted by count DESC.

#### `FinancieroTab`

Composes: `MonthlyRevenueChart`, estimate conversion rate KPI card, pending billing KPI card, `DebtAgingTable`, `TopUnpaidInvoicesList`. Has "Exportar a Excel" button.

#### `ProductividadTab`

Composes: average repair time KPI card, `MechanicProductivityTable`, `TopServicesTable`. Has "Exportar a Excel" button.

### 5.7 SettingsPage Update

Add a 5th tab: **"Dashboard"** with `DashboardSettingsTab`.

#### `DashboardSettingsTab`

A simple form with one field:
- **Días de inactividad para alerta**: numeric input (1-90), current value loaded from `GET /api/dashboard/config`, saved via `PUT /api/dashboard/config`.

### 5.8 New Dependency — MUI X Charts

```bash
npm install @mui/x-charts
```

### 5.9 Routes

No new routes needed. The dashboard remains at `/` and the settings page remains at `/configuracion`.

---

## 6. Business Rules

| # | Rule | Implementation |
|---|---|---|
| 1 | **Read-only feature** (except config) | Dashboard queries are all read-only. The only mutation is `PUT /api/dashboard/config` for the stale threshold setting. |
| 2 | **Open repair orders = non-ENTREGADO** | Same as spec 12. |
| 3 | **Monthly revenue** | Sum of `invoices.total` where `status = 'PAGADA'` and `created_at` in current calendar month. |
| 4 | **Average ticket** | Mean of `invoices.total` for `PAGADA` invoices in the current month. Returns 0 if no paid invoices. |
| 5 | **Today's appointments** | Count + list (max 5) of appointments where `start_time` falls within today. Ordered by `start_time ASC`. |
| 6 | **Stale order threshold** | Configurable via `dashboard_config.stale_threshold_days`. Default 5. A repair order is "stale" if `updated_at` is older than N days AND status is not `ENTREGADO`. |
| 7 | **Pending estimate alerts** | Estimates with `status = 'PENDIENTE'` and `created_at` older than N days (same threshold as stale orders). |
| 8 | **Monthly revenue chart** | Shows last N months (default 6, toggleable to 12). Months with no revenue appear as 0. |
| 9 | **Estimate conversion rate** | `(ACEPTADO count / total estimates) * 100` for the current month. 0% if no estimates exist. |
| 10 | **Pending billing** | Sum of `invoices.total` where `status = 'PENDIENTE'`. |
| 11 | **Debt aging** | Groups unpaid invoices by age ranges: 0-30 days, 31-60, 61-90, 90+. Shows count and total per range. |
| 12 | **Top unpaid invoices** | Max 10, ordered by `total DESC`. |
| 13 | **Average repair time** | Mean days from `created_at` to `updated_at` of repair orders that reached `ENTREGADO` in the current month. Uses `updated_at` as proxy for completion date. |
| 14 | **Completed orders by mechanic** | Count of repair orders assigned to each employee that reached `ENTREGADO` this month. An order with 2 assigned mechanics counts once for each. |
| 15 | **Top services** | Top 10 service names from `invoice_services` on `PAGADA` invoices this month, grouped by `service_name`, ordered by count DESC. |
| 16 | **Excel export format** | Apache POI `.xlsx` with `XSSFTable` using `TableStyleMedium2` style. Currency columns formatted as `$#,##0.00`. Columns auto-sized. One button per tab exports only that tab's data. |
| 17 | **Admin-only sections** | "Facturación del mes", "Ticket promedio", and the entire "Financiero" tab are admin-only. Enforced when spec 13 (auth) is implemented. |
| 18 | **Currency formatting** | Argentine pesos via `formatCurrency` utility (already exists). |
| 19 | **Singleton config** | `dashboard_config` table always has exactly 1 row, inserted by migration. Same pattern as `calendar_config`. |

---

## 7. Testing

### 7.1 Backend — Unit Tests

| Test Class | What it covers |
|---|---|
| `DashboardServiceImplTest` | Unit tests with Mockito for `getSummary()`, `getFinanciero()`, `getProductividad()`: all KPIs, zero counts, null sums, stale alerts, pending estimates, debt aging ranges, monthly revenue grouping, mechanic productivity, top services, config defaults |
| `DashboardExportServiceImplTest` | Unit tests for `exportFinanciero()` and `exportProductividad()`: verifies generated `.xlsx` has correct sheets, correct table names, correct row counts. Uses Apache POI to read back the generated byte array and assert contents. |
| `DashboardControllerTest` | `@WebMvcTest`: all 7 endpoints return expected status codes and JSON/binary structure |

### 7.2 Frontend — Unit Tests

| Test File | What it covers |
|---|---|
| `DashboardPage.test.tsx` | Loading spinner, KPI cards, status breakdown, tabs render, tab switching |
| `KpiCard.test.tsx` | Renders title, value, icon (keep existing) |
| `StatusBreakdownCard.test.tsx` | Renders labels with counts, empty state (keep existing) |
| `TodayAppointmentsList.test.tsx` | Renders appointment list, empty state |
| `StaleOrderAlerts.test.tsx` | Renders alerts with days count, empty state |
| `PendingEstimateAlerts.test.tsx` | Renders alerts with days count, empty state |
| `FinancieroTab.test.tsx` | Renders chart, conversion rate, debt aging, unpaid invoices, export button |
| `ProductividadTab.test.tsx` | Renders avg repair time, mechanic table, services table, export button |
| `MonthlyRevenueChart.test.tsx` | Renders chart, toggles 6/12 months |
| `DebtAgingTable.test.tsx` | Renders 4 age ranges with counts and totals |
| `MechanicProductivityTable.test.tsx` | Renders mechanic names and counts |
| `TopServicesTable.test.tsx` | Renders service names and counts |
| `DashboardSettingsTab.test.tsx` | Loads config, saves config, validates input range |
| `useDashboard.test.ts` | Hook fetch, loading/error states, refetch (update existing) |
| `useFinanciero.test.ts` | Hook fetch with months param, export trigger, error states |
| `useProductividad.test.ts` | Hook fetch, export trigger, error states |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend — Setup

- [ ] Add Apache POI dependency to `pom.xml`
- [ ] Create migration `V2__add_dashboard_config.sql`
- [ ] Create `DashboardConfig` entity
- [ ] Create `DashboardConfigRepository`

### 8.2 Backend — DTOs

- [ ] Update `DashboardSummaryResponse` (add `averageTicket`, `todayAppointments`, `staleOrderAlerts`, `pendingEstimateAlerts`, `staleThresholdDays`; remove `totalPendingBilling`)
- [ ] Create `TodayAppointmentResponse`
- [ ] Create `StaleOrderAlertResponse`
- [ ] Create `PendingEstimateAlertResponse`
- [ ] Create `DashboardFinancieroResponse`
- [ ] Create `MonthlyRevenueResponse`
- [ ] Create `DebtAgingResponse`
- [ ] Keep `UnpaidInvoiceResponse` (unchanged)
- [ ] Create `DashboardProductividadResponse`
- [ ] Create `MechanicProductivityResponse`
- [ ] Create `TopServiceResponse`
- [ ] Create `DashboardConfigRequest`
- [ ] Create `DashboardConfigResponse`
- [ ] Keep `StatusCountResponse` (unchanged)

### 8.3 Backend — Repository Methods

- [ ] `RepairOrderRepository.findStaleOrders(threshold, excludedStatus)`
- [ ] `RepairOrderRepository.avgRepairDaysByStatusAndUpdatedAtBetween(status, start, end)`
- [ ] `RepairOrderRepository.countCompletedByEmployee(status, start, end)`
- [ ] `InvoiceRepository.avgTotalByStatusAndCreatedAtBetween(status, start, end)`
- [ ] `InvoiceRepository.sumTotalByStatusGroupByMonth(status, start, end)`
- [ ] `InvoiceRepository.countAndSumByStatusAndCreatedAtBetween(status, start, end)`
- [ ] `InvoiceRepository.countAndSumByStatusAndCreatedAtBefore(status, before)`
- [ ] `InvoiceRepository.findTopServiceNames(status, start, end, pageable)`
- [ ] `EstimateRepository.countByStatusAndCreatedAtBetween(status, start, end)`
- [ ] `EstimateRepository.countByCreatedAtBetween(start, end)`
- [ ] `EstimateRepository.findPendingOlderThan(status, threshold)`

### 8.4 Backend — Services

- [ ] Update `DashboardService` interface (add `getFinanciero`, `getProductividad`, `getConfig`, `updateConfig`)
- [ ] Update `DashboardServiceImpl.getSummary()` (add avg ticket, appointments list, stale alerts, pending estimates)
- [ ] Implement `DashboardServiceImpl.getFinanciero(months)`
- [ ] Implement `DashboardServiceImpl.getProductividad()`
- [ ] Implement `DashboardServiceImpl.getConfig()` and `updateConfig()`
- [ ] Create `DashboardExportService` interface
- [ ] Create `DashboardExportServiceImpl` with Apache POI (XSSFTable, TableStyleMedium2)
- [ ] Implement `exportFinanciero()` (4 sheets: Monthly Revenue, Debt Aging, Unpaid Invoices, Summary)
- [ ] Implement `exportProductividad()` (2 sheets: Mechanic Productivity, Top Services)

### 8.5 Backend — Controller

- [ ] Update `DashboardController` (add 6 new endpoints: financiero, productividad, config GET/PUT, export x2)
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.6 Frontend — Setup

- [ ] Install `@mui/x-charts`: `npm install @mui/x-charts`
- [ ] Update types in `src/features/dashboard/types.ts`
- [ ] Update API layer in `src/api/dashboard.ts`

### 8.7 Frontend — Hooks

- [ ] Update `useDashboard.ts` (returns enhanced summary)
- [ ] Create `useFinanciero.ts` (with months param + exportToExcel)
- [ ] Create `useProductividad.ts` (with exportToExcel)

### 8.8 Frontend — Components

- [ ] Create `TodayAppointmentsList` — next 5 appointments with time, client, plate, purpose
- [ ] Create `StaleOrderAlerts` — warning alerts for stale orders
- [ ] Create `PendingEstimateAlerts` — info alerts for pending estimates
- [ ] Create `MonthlyRevenueChart` — MUI X Charts `BarChart` with 6/12 toggle
- [ ] Create `DebtAgingTable` — MUI Table with 4 age ranges
- [ ] Create `MechanicProductivityTable` — MUI Table with mechanic stats
- [ ] Create `TopServicesTable` — MUI Table with top billed services
- [ ] Create `FinancieroTab` — composes chart + KPIs + tables + export button
- [ ] Create `ProductividadTab` — composes avg time + tables + export button
- [ ] Keep `KpiCard`, `StatusBreakdownCard`, `TopUnpaidInvoicesList` (unchanged or minor updates)

### 8.9 Frontend — Pages

- [ ] Update `DashboardPage` — fixed top section + tabbed bottom section
- [ ] Update `SettingsPage` — add 5th tab "Dashboard"
- [ ] Create `DashboardSettingsTab` — stale threshold config form

### 8.10 Frontend — Verification

- [ ] Verify frontend compiles: `npx tsc --noEmit`
- [ ] Verify frontend runs: `npm run dev`

### 8.11 Business Rules Verification

- [ ] Open repair orders = non-ENTREGADO
- [ ] Monthly revenue = sum of paid invoices for current month
- [ ] Average ticket = mean of paid invoice totals for current month
- [ ] Today's appointments = count + list (max 5) ordered by start_time ASC
- [ ] Stale order threshold = configurable via Settings, default 5 days
- [ ] Pending estimate alerts use same threshold as stale orders
- [ ] Monthly revenue chart default 6 months, toggleable to 12
- [ ] Estimate conversion rate = accepted / total * 100 for current month
- [ ] Debt aging grouped into 4 ranges (0-30, 31-60, 61-90, 90+)
- [ ] Top unpaid invoices limited to 10, ordered by total DESC
- [ ] Average repair time = mean days (created_at to updated_at) for ENTREGADO this month
- [ ] Completed orders by mechanic for current month
- [ ] Top services = top 10 from invoice_services on paid invoices this month
- [ ] Excel export uses XSSFTable with TableStyleMedium2, auto-sized columns
- [ ] One export button per tab
- [ ] Currency formatted as Argentine pesos
- [ ] Dashboard config is singleton (1 row)

### 8.12 Testing

- [ ] `DashboardServiceImplTest` — unit tests for getSummary, getFinanciero, getProductividad, getConfig, updateConfig
- [ ] `DashboardExportServiceImplTest` — unit tests for exportFinanciero, exportProductividad (verify .xlsx content)
- [ ] `DashboardControllerTest` — @WebMvcTest for all 7 endpoints
- [ ] `DashboardPage.test.tsx`
- [ ] `TodayAppointmentsList.test.tsx`
- [ ] `StaleOrderAlerts.test.tsx`
- [ ] `PendingEstimateAlerts.test.tsx`
- [ ] `FinancieroTab.test.tsx`
- [ ] `ProductividadTab.test.tsx`
- [ ] `MonthlyRevenueChart.test.tsx`
- [ ] `DebtAgingTable.test.tsx`
- [ ] `MechanicProductivityTable.test.tsx`
- [ ] `TopServicesTable.test.tsx`
- [ ] `DashboardSettingsTab.test.tsx`
- [ ] `useDashboard.test.ts` (update)
- [ ] `useFinanciero.test.ts`
- [ ] `useProductividad.test.ts`
- [ ] `KpiCard.test.tsx` (keep existing)
- [ ] `StatusBreakdownCard.test.tsx` (keep existing)
- [ ] `TopUnpaidInvoicesList.test.tsx` (keep existing)
