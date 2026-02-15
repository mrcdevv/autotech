# 12 — Dashboard / Inicio

## 1. Overview

This feature implements the **Dashboard (Inicio)** — the home page of Autotech. It is a **read-only** feature that displays key performance indicators (KPIs) and summary data for the workshop. The backend provides aggregation endpoints and the frontend renders KPI cards and lists.

The dashboard displays:

1. **Open repair order count** — total number of non-`ENTREGADO` repair orders (equivalent to vehicle count in the workshop).
2. **Total pending billing** — sum of unbilled amounts across active repair orders (**admin only**).
3. **Today's appointments count** — number of appointments scheduled for today.
4. **Monthly revenue** — total invoiced amount for the current month (**admin only**).
5. **Vehicle count by repair order status** — breakdown of repair orders by status (matches kanban column counts).
6. **Top unpaid invoices** — list of invoices with status `PENDIENTE` ordered by highest total (**admin only**).

> **Note**: Items marked "admin only" are only visible to users with the `ADMINISTRADOR` role. When authentication is implemented (spec 13), these sections will be conditionally rendered. For now, the backend provides all data and the frontend renders everything.

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/dashboard` |
| Base | `main` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add DashboardService with aggregation queries`
- `feat: add DashboardController with summary endpoint`
- `feat: add DashboardPage with KPI cards`
- `feat: add StatusBreakdownCard with repair order counts`
- `feat: add TopUnpaidInvoicesList component`
- `test: add unit tests for DashboardService`

---

## 3. DB Tables

This feature does **not** create any new tables. It performs **read-only aggregation queries** across existing tables:

### Referenced Tables

| Table | Purpose |
|---|---|
| `repair_orders` | Count open orders, count by status |
| `appointments` | Count today's appointments |
| `invoices` | Monthly revenue (sum of `total` where `status = 'PAGADA'`), top unpaid (where `status = 'PENDIENTE'`) |
| `estimates` | Pending billing calculation (sum of totals for `ACEPTADO` estimates without a `PAGADA` invoice) |
| `clients` | Client name for unpaid invoices list |
| `vehicles` | Vehicle plate for unpaid invoices list |

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.dashboard/
├── controller/
│   └── DashboardController.java
├── service/
│   ├── DashboardService.java               (interface)
│   └── DashboardServiceImpl.java           (implementation)
└── dto/
    ├── DashboardSummaryResponse.java
    ├── StatusCountResponse.java
    └── UnpaidInvoiceResponse.java
```

> **Note**: No entities, repositories, or mappers are needed for this feature. The service uses existing repositories from other packages (`RepairOrderRepository`, `AppointmentRepository`, `InvoiceRepository`).

### 4.2 DTOs

Location: `com.autotech.dashboard.dto`

#### `DashboardSummaryResponse`

```java
public record DashboardSummaryResponse(
    Long openRepairOrderCount,
    BigDecimal totalPendingBilling,
    Long todayAppointmentCount,
    BigDecimal monthlyRevenue,
    List<StatusCountResponse> repairOrderStatusCounts,
    List<UnpaidInvoiceResponse> topUnpaidInvoices
) {}
```

#### `StatusCountResponse`

```java
public record StatusCountResponse(
    String status,
    Long count
) {}
```

#### `UnpaidInvoiceResponse`

```java
public record UnpaidInvoiceResponse(
    Long invoiceId,
    String clientFullName,
    String vehiclePlate,
    BigDecimal total,
    LocalDateTime createdAt
) {}
```

### 4.3 Service — `DashboardService`

```java
public interface DashboardService {

    DashboardSummaryResponse getSummary();
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

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        // 1. Open repair order count (all statuses except ENTREGADO)
        Long openOrderCount = repairOrderRepository.countByStatusNot(RepairOrderStatus.ENTREGADO);

        // 2. Total pending billing
        //    Sum of invoice totals where status = 'PENDIENTE'
        BigDecimal totalPendingBilling = invoiceRepository.sumTotalByStatus("PENDIENTE");
        if (totalPendingBilling == null) totalPendingBilling = BigDecimal.ZERO;

        // 3. Today's appointment count
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        Long todayAppointmentCount = appointmentRepository.countByStartTimeBetween(todayStart, todayEnd);

        // 4. Monthly revenue (sum of paid invoice totals for current month)
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        BigDecimal monthlyRevenue = invoiceRepository.sumTotalByStatusAndCreatedAtBetween(
            "PAGADA", monthStart, monthEnd);
        if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;

        // 5. Repair order count by status
        List<StatusCountResponse> statusCounts = repairOrderRepository.countGroupByStatus().stream()
            .map(row -> new StatusCountResponse((String) row[0], (Long) row[1]))
            .toList();

        // 6. Top unpaid invoices (limit 10, ordered by total DESC)
        List<UnpaidInvoiceResponse> topUnpaid = invoiceRepository.findTopUnpaidInvoices(
            PageRequest.of(0, 10)).stream()
            .map(inv -> new UnpaidInvoiceResponse(
                inv.getId(),
                inv.getClient().getFirstName() + " " + inv.getClient().getLastName(),
                inv.getVehicle() != null ? inv.getVehicle().getPlate() : null,
                inv.getTotal(),
                inv.getCreatedAt()
            ))
            .toList();

        return new DashboardSummaryResponse(
            openOrderCount,
            totalPendingBilling,
            todayAppointmentCount,
            monthlyRevenue,
            statusCounts,
            topUnpaid
        );
    }
}
```

### 4.4 Additional Repository Methods

These methods need to be added to existing repositories:

#### `RepairOrderRepository` (additions)

```java
Long countByStatusNot(RepairOrderStatus status);

@Query("SELECT ro.status, COUNT(ro) FROM RepairOrder ro GROUP BY ro.status")
List<Object[]> countGroupByStatus();
```

#### `AppointmentRepository` (additions)

```java
Long countByStartTimeBetween(LocalDateTime start, LocalDateTime end);
```

#### `InvoiceRepository` (additions)

```java
@Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = :status")
BigDecimal sumTotalByStatus(@Param("status") String status);

@Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = :status AND i.createdAt >= :start AND i.createdAt < :end")
BigDecimal sumTotalByStatusAndCreatedAtBetween(
    @Param("status") String status,
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end
);

@Query("SELECT i FROM Invoice i JOIN FETCH i.client LEFT JOIN FETCH i.vehicle WHERE i.status = 'PENDIENTE' ORDER BY i.total DESC")
List<Invoice> findTopUnpaidInvoices(Pageable pageable);
```

### 4.5 Controller — `DashboardController`

Location: `com.autotech.dashboard.controller.DashboardController`

Base path: `/api/dashboard`

```java
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getSummary()));
    }
}
```

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Get full dashboard summary (all KPIs in one call) |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   └── dashboard.ts
├── features/
│   └── dashboard/
│       ├── components/
│       │   ├── KpiCard.tsx
│       │   ├── StatusBreakdownCard.tsx
│       │   └── TopUnpaidInvoicesList.tsx
│       └── hooks/
│           └── useDashboard.ts
├── pages/
│   └── DashboardPage.tsx
└── types/
    └── dashboard.ts
```

### 5.2 Types

Location: `src/features/dashboard/types.ts`

```typescript
interface StatusCountResponse {
  status: string;
  count: number;
}

interface UnpaidInvoiceResponse {
  invoiceId: number;
  clientFullName: string;
  vehiclePlate: string | null;
  total: number;
  createdAt: string;
}

interface DashboardSummaryResponse {
  openRepairOrderCount: number;
  totalPendingBilling: number;
  todayAppointmentCount: number;
  monthlyRevenue: number;
  repairOrderStatusCounts: StatusCountResponse[];
  topUnpaidInvoices: UnpaidInvoiceResponse[];
}
```

### 5.3 API

Location: `src/api/dashboard.ts`

```typescript
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { DashboardSummaryResponse } from "@/features/dashboard/types";

export const dashboardApi = {
  getSummary: () =>
    apiClient.get<ApiResponse<DashboardSummaryResponse>>("/dashboard/summary"),
};
```

### 5.4 Hooks

Location: `src/features/dashboard/hooks/`

#### `useDashboard.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardSummaryResponse } from "@/features/dashboard/types";

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getSummary();
      setSummary(res.data.data);
    } catch {
      setError("Error al cargar el resumen del dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
```

### 5.5 Pages

#### `DashboardPage`

Location: `src/pages/DashboardPage.tsx`

Route: `/` (home)

```tsx
import { Box, Typography, Grid, CircularProgress, Alert } from "@mui/material";
import { KpiCard } from "@/features/dashboard/components/KpiCard";
import { StatusBreakdownCard } from "@/features/dashboard/components/StatusBreakdownCard";
import { TopUnpaidInvoicesList } from "@/features/dashboard/components/TopUnpaidInvoicesList";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";

export default function DashboardPage() {
  const { summary, loading, error } = useDashboard();

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!summary) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Inicio</Typography>

      {/* KPI Cards Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Órdenes abiertas"
            value={summary.openRepairOrderCount}
            icon={<BuildIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Pendiente de cobro"
            value={formatCurrency(summary.totalPendingBilling)}
            icon={<AttachMoneyIcon />}
            adminOnly
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Citas de hoy"
            value={summary.todayAppointmentCount}
            icon={<EventIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Facturación del mes"
            value={formatCurrency(summary.monthlyRevenue)}
            icon={<TrendingUpIcon />}
            adminOnly
          />
        </Grid>
      </Grid>

      {/* Bottom Row: Status Breakdown + Unpaid Invoices */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <StatusBreakdownCard statusCounts={summary.repairOrderStatusCounts} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TopUnpaidInvoicesList invoices={summary.topUnpaidInvoices} />
        </Grid>
      </Grid>
    </Box>
  );
}
```

### 5.6 Components

#### `KpiCard`

Location: `src/features/dashboard/components/KpiCard.tsx`

A card displaying a single KPI metric.

```tsx
interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export function KpiCard({ title, value, icon, adminOnly }: KpiCardProps) {
  // adminOnly prop is for future use with authentication (spec 13)
  // When auth is implemented, conditionally render based on user role

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
          </Box>
          <Box sx={{ color: "primary.main", opacity: 0.7 }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
```

#### `StatusBreakdownCard`

Location: `src/features/dashboard/components/StatusBreakdownCard.tsx`

Displays repair order counts grouped by status.

```tsx
interface StatusBreakdownCardProps {
  statusCounts: StatusCountResponse[];
}

const STATUS_LABELS: Record<string, string> = {
  INGRESO_VEHICULO: "Ingresó vehículo",
  ESPERANDO_APROBACION_PRESUPUESTO: "Esperando aprobación presupuesto",
  ESPERANDO_REPUESTOS: "Esperando repuestos",
  REPARACION: "Reparación",
  PRUEBAS: "Pruebas",
  LISTO_PARA_ENTREGAR: "Listo para entregar",
  ENTREGADO: "Entregado",
};

export function StatusBreakdownCard({ statusCounts }: StatusBreakdownCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Vehículos por estado</Typography>
        <List dense>
          {statusCounts.map((sc) => (
            <ListItem key={sc.status}>
              <ListItemText primary={STATUS_LABELS[sc.status] ?? sc.status} />
              <Typography variant="body1" fontWeight="bold">{sc.count}</Typography>
            </ListItem>
          ))}
          {statusCounts.length === 0 && (
            <Typography color="text.secondary">No hay órdenes de trabajo</Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
}
```

#### `TopUnpaidInvoicesList`

Location: `src/features/dashboard/components/TopUnpaidInvoicesList.tsx`

Displays the top unpaid invoices (admin only).

```tsx
interface TopUnpaidInvoicesListProps {
  invoices: UnpaidInvoiceResponse[];
}

export function TopUnpaidInvoicesList({ invoices }: TopUnpaidInvoicesListProps) {
  // adminOnly — will be conditionally rendered when auth is implemented (spec 13)

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Facturas con mayor deuda</Typography>
        {invoices.length === 0 ? (
          <Typography color="text.secondary">No hay facturas pendientes</Typography>
        ) : (
          <List dense>
            {invoices.map((inv) => (
              <ListItem key={inv.invoiceId}>
                <ListItemText
                  primary={`Factura #${inv.invoiceId} — ${inv.clientFullName}`}
                  secondary={inv.vehiclePlate ? `Patente: ${inv.vehiclePlate}` : undefined}
                />
                <Typography variant="body1" fontWeight="bold" color="error.main">
                  {formatCurrency(inv.total)}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5.7 Routes

Location: `src/routes/`

```typescript
{ path: "/", element: <DashboardPage /> }
```

Lazy loaded via `React.lazy`:

```typescript
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
```

---

## 6. Business Rules

| # | Rule | Implementation |
|---|---|---|
| 1 | **Read-only feature** | No CRUD operations. The dashboard only reads data via aggregation queries. The single endpoint `GET /api/dashboard/summary` returns all KPIs in one response. |
| 2 | **Open repair orders = non-ENTREGADO** | The count excludes repair orders with status `ENTREGADO`. All other statuses are considered "open". |
| 3 | **Pending billing = unpaid invoice totals** | Sum of `invoices.total` where `status = 'PENDIENTE'`. This represents the total amount owed to the workshop. |
| 4 | **Today's appointments** | Count of appointments where `start_time` falls within today's date (00:00:00 to 23:59:59). |
| 5 | **Monthly revenue** | Sum of `invoices.total` where `status = 'PAGADA'` and `created_at` falls within the current calendar month. |
| 6 | **Status breakdown** | Groups repair orders by status and returns the count for each. Uses a `GROUP BY` query. All 7 statuses may appear; missing statuses mean count = 0. |
| 7 | **Top unpaid invoices limit** | Returns at most 10 invoices with `status = 'PENDIENTE'`, ordered by `total DESC` (highest debt first). |
| 8 | **Admin-only sections** | "Pendiente de cobro", "Facturación del mes", and "Facturas con mayor deuda" should only be visible to `ADMINISTRADOR` users. Until authentication (spec 13) is implemented, these sections are rendered for all users. The `adminOnly` prop on `KpiCard` is a placeholder for future role-based rendering. |
| 9 | **Single API call** | The frontend fetches all dashboard data in a single request (`GET /api/dashboard/summary`) to minimize network overhead. The backend assembles all aggregations in one service method. |
| 10 | **Currency formatting** | All monetary values are formatted as Argentine pesos (e.g., `$1.234,56`) using a shared `formatCurrency` utility in the frontend. |

---

## 7. Testing

### 7.1 Backend — Unit Tests

| Test Class | What it covers |
|---|---|
| `DashboardServiceImplTest` | Unit tests with Mockito for `getSummary()`: verifies correct aggregation of all 6 KPIs, handles zero counts, handles null sums (no invoices), correct status grouping, top unpaid invoices limit of 10, empty lists when no data |
| `DashboardControllerTest` | `@WebMvcTest` with mocked service: `GET /api/dashboard/summary` returns 200 with all fields populated, returns 200 with zero/empty data |

### 7.2 Backend — Integration Tests

| Test Class | What it covers |
|---|---|
| `DashboardIntegrationTest` | `@SpringBootTest` + Testcontainers: seeds repair orders with various statuses, creates appointments for today and other dates, creates paid and unpaid invoices. Verifies the `/api/dashboard/summary` endpoint returns correct aggregated values. |

### 7.3 Frontend — Unit Tests

| Test File | What it covers |
|---|---|
| `DashboardPage.test.tsx` | Renders loading spinner, renders all KPI cards after data loads, renders status breakdown and unpaid invoices list, shows error alert on API failure |
| `KpiCard.test.tsx` | Renders title, value, and icon correctly, applies adminOnly prop (placeholder for future filtering) |
| `StatusBreakdownCard.test.tsx` | Renders status labels with counts, maps status enum to Spanish labels, shows empty state when no statuses |
| `TopUnpaidInvoicesList.test.tsx` | Renders invoice list with client name, plate, and formatted total, shows empty state when no unpaid invoices |
| `useDashboard.test.ts` | Hook fetches summary on mount, handles loading/error states, refetch works correctly |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.
>
> **Note**: This is a **read-only** feature — no new entities, repositories, or mappers are needed. The backend performs aggregation queries using existing repositories.

### 8.1 Backend

- [x] Create enum(s) (N/A — no new enums; uses existing `RepairOrderStatus`)
- [x] Create entity/entities (N/A — no new entities; reads from existing tables)
- [x] Create repository/repositories (N/A — no new repositories; adds methods to existing ones)
- [ ] Add aggregation methods to existing repositories:
  - [ ] `RepairOrderRepository.countByStatusNot(RepairOrderStatus status)`
  - [ ] `RepairOrderRepository.countGroupByStatus()` (JPQL `GROUP BY` query)
  - [ ] `AppointmentRepository.countByStartTimeBetween(LocalDateTime start, LocalDateTime end)`
  - [ ] `InvoiceRepository.sumTotalByStatus(String status)`
  - [ ] `InvoiceRepository.sumTotalByStatusAndCreatedAtBetween(String status, LocalDateTime start, LocalDateTime end)`
  - [ ] `InvoiceRepository.findTopUnpaidInvoices(Pageable pageable)`
- [x] Create request DTO(s) (N/A — read-only feature, no request DTOs)
- [ ] Create response DTOs:
  - [ ] `DashboardSummaryResponse` (record with all 6 KPI fields)
  - [ ] `StatusCountResponse` (record with `status` and `count`)
  - [ ] `UnpaidInvoiceResponse` (record with `invoiceId`, `clientFullName`, `vehiclePlate`, `total`, `createdAt`)
- [x] Create mapper(s) (N/A — DTOs are assembled directly in service, no entity-to-DTO mapping needed)
- [ ] Create `DashboardService` interface with `getSummary()`
- [ ] Create `DashboardServiceImpl`:
  - [ ] `getSummary()` — aggregates all 6 KPIs: open order count, pending billing, today's appointments, monthly revenue, status breakdown, top unpaid invoices
- [ ] Create `DashboardController` with endpoint:
  - [ ] `GET /api/dashboard/summary` — returns full dashboard summary
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [ ] Create types file (`src/features/dashboard/types.ts`) with `DashboardSummaryResponse`, `StatusCountResponse`, `UnpaidInvoiceResponse`
- [ ] Create API layer (`src/api/dashboard.ts`) with `getSummary`
- [ ] Create `useDashboard` hook (`src/features/dashboard/hooks/useDashboard.ts`)
- [ ] Create `DashboardPage` (`src/pages/DashboardPage.tsx`) with KPI cards grid and bottom row
- [ ] Create `KpiCard` component — displays a single KPI with title, value, icon, and `adminOnly` prop
- [ ] Create `StatusBreakdownCard` component — renders repair order counts grouped by status with Spanish labels
- [ ] Create `TopUnpaidInvoicesList` component — renders top 10 unpaid invoices with client name, plate, and formatted total
- [ ] Register route `/` (home) with lazy loading
- [ ] Verify frontend compiles
- [ ] Verify frontend runs

### 8.3 Business Rules Verification

- [ ] Read-only feature — no CRUD operations, single `GET` endpoint returns all KPIs
- [ ] Open repair orders = non-`ENTREGADO` — count excludes `ENTREGADO` status
- [ ] Pending billing = sum of unpaid invoice totals (status `PENDIENTE`)
- [ ] Today's appointments — count where `start_time` falls within today's date range
- [ ] Monthly revenue — sum of paid invoice totals (status `PAGADA`) for current calendar month
- [ ] Status breakdown — groups repair orders by status with count for each
- [ ] Top unpaid invoices limited to 10, ordered by `total` DESC
- [ ] Admin-only sections — `adminOnly` prop on KPI cards for "Pendiente de cobro", "Facturación del mes"; `TopUnpaidInvoicesList` is admin-only (enforced when spec 13 is implemented)
- [ ] Single API call — frontend fetches all data in one request
- [ ] Currency formatting — monetary values displayed as Argentine pesos (e.g., `$1.234,56`)

### 8.4 Testing

- [ ] `DashboardServiceImplTest` — unit tests with Mockito for `getSummary()`: all 6 KPIs, zero counts, null sums, status grouping, top unpaid limit, empty data
- [ ] `DashboardControllerTest` — `@WebMvcTest`: GET returns 200 with all fields, returns 200 with empty data
- [ ] `DashboardIntegrationTest` — `@SpringBootTest` + Testcontainers: seed data, verify aggregated values via HTTP
- [ ] `DashboardPage.test.tsx` — loading spinner, all KPI cards, status breakdown, unpaid invoices, error alert
- [ ] `KpiCard.test.tsx` — renders title, value, icon; applies `adminOnly` prop
- [ ] `StatusBreakdownCard.test.tsx` — renders status labels with counts, Spanish labels, empty state
- [ ] `TopUnpaidInvoicesList.test.tsx` — renders invoice list, empty state
- [ ] `useDashboard.test.ts` — hook fetch, loading/error states, refetch
