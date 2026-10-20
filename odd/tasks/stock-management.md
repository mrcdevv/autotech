# Stock management (reservations, consumption, movements, low-stock alerts)

## Context

- **Branch**: `claude/stock-management-967b15` (cut from `develop` @ `a8c140f`)
- **Engram mirror**: `odd/stock-management/tasks`
- **Delivery**: one Conventional Commit per task on this branch. Push / PR / merge are the user's decision.
  The feature is well above ~400 authored lines; the user should pick the PR strategy (single PR or
  chained per task — the per-task commits are cut so each one is a reviewable slice).

## Objective

Turn `products.quantity` from a hand-edited number into a real stock ledger: line items link to
catalog products, approved estimates on a repair order reserve stock, delivering the car consumes it,
standalone delivery notes (counter sales) consume directly, every change is an auditable movement, and
low stock (available = on hand − reserved, compared to min stock) is visible on the products page and
the dashboard.

## Problem (as found on 2026-10-19)

- `products.quantity` is only overwritten by the product edit form; nothing deducts it.
- `estimate_products`, `delivery_note_products`, `canned_job_products` copy name/price as free text — no FK.
- No min stock, reservation, movement history, low-stock alert or optimistic locking.

## Agreed design (locked with the user)

| Event | Stock effect |
|---|---|
| Estimate linked to a repair order gets approved | RESERVE its catalog-linked products |
| Repair order -> ENTREGADO | CONSUME (from the approved estimate's lines) and release the reservation, with or without a delivery note |
| Repair order -> CANCELADO, or its estimate rejected | RELEASE the reservation |
| Repair order moves back out of ENTREGADO | RETURN stock and re-reserve |
| Delivery note WITHOUT repair order | CONSUME on create, RETURN on delete (re-sync on line edits) |
| Delivery note WITH repair order | no stock effect (the repair order owns it) |
| Approved estimate's product lines edited | re-sync the reservation |

- Free-text lines (no product link) never touch stock.
- Available = on hand − reserved; low stock when available < min stock (min stock set).
- Consumption never blocks delivery: on hand may go negative (alert). Over-reservation allowed, UI warns.

## Technical approach

- **Ledger per source**: `stock_movements(product_id, type, quantity>0, source_type, source_id, reason,
  created_by_employee_id, created_at)`. Types `INITIAL | ADJUSTMENT | RESERVE | RELEASE | CONSUME | RETURN`;
  `quantity` is always positive for RESERVE/RELEASE/CONSUME/RETURN (the type gives direction) and signed for
  INITIAL/ADJUSTMENT (the on-hand delta).
- **Idempotent sync**: `StockService.syncRepairOrder(id)` / `syncDeliveryNote(id)` compute the *desired*
  reserved and consumed quantity per product for the source, subtract what that source's movements already
  applied (`RESERVE−RELEASE`, `CONSUME−RETURN`), and write only the delta. Calling it twice is a no-op, so
  any repeated or out-of-order status change cannot double count.
  - Repair order: lines = all ACEPTADO estimates of the order with a product link.
    ENTREGADO → reserved 0 / consumed lines; CANCELADO → 0 / 0; otherwise → lines / 0.
  - Delivery note without repair order: consumed = its linked lines; deleted → 0.
- **Concurrency**: product rows touched by a sync/adjustment are loaded with `PESSIMISTIC_WRITE`
  (`SELECT … FOR UPDATE`) in a stable id order (avoids deadlocks); `products.version` + `@Version` guards
  the product edit form against lost updates.
- StockService reads estimates / repair orders / delivery notes through their repositories (same pattern
  as `EstimateServiceImpl` → `RepairOrderRepository`) so the owning services can depend on it without a
  bean cycle.

## Tasks

| ID | Task | Route | Status | Commit |
|---|---|---|---|---|
| T1 | Schema V18 + entities/DTOs/mappers carry `productId` | inline (parent) | ☑ | `a63c2a7` |
| T2 | StockService (ledger + idempotent sync + locking) hooked into estimates, repair orders, delivery notes; tests per design row | inline (parent) | ☑ | `4c1ead8` |
| T3 | Endpoints: adjustment with reason, movement history, low-stock list; product edit no longer sets on hand; `manage_stock` permission | inline (parent) | ☑ | `ebd093a` |
| T4 | Frontend: shared product picker with productId + available + warning; products page stock columns, badge/filter, adjust dialog, history | inline (parent) | ☑ | `542798a` |
| T5 | Dashboard low-stock widget | inline (parent) | ☑ | `87855ad` |
| V | Full verification + end-to-end run | parent | ☑ | (docs commit) |

Route note: the parent keeps the implementation because each task is a tightly coupled vertical slice
whose design is already settled in this document; delegating would re-ship the same context to a writer.

### T1 — Schema
- [x] `V18__add_stock_management.sql`: `product_id` FK `ON DELETE SET NULL` + index on the three line tables;
      `products.min_stock`, `reserved_quantity` (default 0), `version` (default 0); `stock_movements` + indexes;
      INITIAL movement for every existing product with quantity ≠ 0; backfill `canned_job_products.product_id`
      by unique case-insensitive name match (no stock effect). Estimate / delivery note lines are NOT
      backfilled (would create phantom reservations for orders already in flight).
- [x] Entities: `Product` (minStock, reservedQuantity, @Version), line entities `@ManyToOne Product product`.
- [x] Request/response DTOs + mappers carry `productId` (and product responses carry minStock, reserved,
      available, lowStock); canned job → estimate propagates the link (frontend copies it).
- Acceptance: `./mvnw clean test` green.

### T2 — StockService
- [x] `stock` package: `StockMovement`, `StockMovementType`, `StockSourceType`, repository, `StockService(+Impl)`.
- [x] Hooks: estimate approve / reject / update / delete; repair order status change + delete;
      delivery note create / delete (no update endpoint exists — see deviations).
- [x] Tests: one per design row + idempotency (repeat sync), double count (ENTREGADO→REPARACION→ENTREGADO),
      free-text lines ignored, negative on hand allowed.
- Acceptance: `./mvnw clean test` green.

### T3 — Endpoints
- [x] `POST /api/products/{id}/stock-adjustments` (reason mandatory, `manage_stock`).
- [x] `GET /api/products/{id}/stock-movements` (paginated), `GET /api/products/low-stock`, `?lowStock=true` filter.
- [x] Product create → INITIAL movement; product update no longer changes on hand.
- [x] `V19` permission `manage_stock` → ADMINISTRADOR, JEFE_TALLER.

### T4 — Frontend
- [x] Shared `ProductLinesGrid` (catalog feature) used by both ProductsGrids (stores productId, shows available, warns qty > available).
- [x] Products page: on hand / reserved / available / min stock columns, "Stock bajo" badge + filter,
      adjust-stock dialog with reason, movements history dialog. Product form: initial stock only on create.
- [x] Canned job form stores productId and passes it into estimates.

### T5 — Dashboard
- [x] `lowStockAlerts` in dashboard summary + `LowStockAlerts` widget.

## Final verification (2026-10-20)

- Backend `mvn clean verify` (Testcontainers): **519 unit + 84 IT, 0 failures** ✅
- Frontend `npm run lint` 0 errors (2 pre-existing warnings) · `npm test` 103 files / 457 tests ✅ · `npm run build` ✅
- End-to-end on a running stack (backend :8081 on a throwaway DB `autotech_stock_e2e` in the local
  `autotech-db` container, Vite :3001; ports 8080/3000 belonged to the main checkout's dev stack and were left alone).
  API script, **15/15 checks**:
  create product (10, min 4) → INITIAL · RO + approved estimate (3 linked + free-text line) → 10/3/7 ·
  ENTREGADO → 7/0/7 · ENTREGADO again → unchanged · back to REPARACION → 10/3/7 · ENTREGADO → 7/0/7 ·
  second RO approved 2 → 7/2/5 · CANCELADO → 7/0/7 · standalone remito 4 → 3/0/3 low stock, listed in
  `/products/low-stock` and dashboard `lowStockAlerts` · remito deleted → 7/0/7 · SET 2 → 2 · empty reason → 400 ·
  product edit with quantity 999 → on hand unchanged.
  UI (browser): dashboard "Stock bajo" panel lists the product (2 / 4, "Bajo mínimo"); products page shows the
  stock columns, "Stock bajo" badge and filter; movement history shows type, signed effect, origin
  (OT / Remito / Manual), reason and user; adjust dialog (+10 "Compra a proveedor") previews and applies 2 → 12;
  estimate picker shows "Disp.: 12", fills the catalog price and warns "Supera el stock disponible (12)".
- Local notes: the seeded admin must change password on first login (flag cleared by SQL in the throwaway DB);
  `SecurityConfig` CORS only allows origin :3000, so the temporary Vite config rewrote `Origin` (not committed).

## Acceptance criteria
- Every row of the design table observed in tests and in the running app.
- No path counts the same source twice (idempotent sync).
- `./mvnw clean verify`, `npm run lint`, `npm test`, `npm run build` green.

## Deviations / notes
- **Approved estimate line edits**: today only PENDIENTE estimates are editable, so an approved estimate's
  lines cannot change. `EstimateServiceImpl.update` still re-syncs the repair order, so the design row holds
  automatically if that rule is relaxed later.
- **Estimate rejected after approval**: not possible today (decisions only from PENDIENTE). Rejection still
  re-syncs; deleting an approved estimate re-syncs too, releasing its reservation (tested).
- **Delivery note line edits**: there is no delivery note update endpoint. `StockService.syncDeliveryNote`
  is idempotent and ready to be called from one if it is added.
- **Repair order delete**: releases what it still reserves; stock already consumed stays consumed (the parts
  left the workshop).
- **Status changes always re-sync** (not only on ENTREGADO/CANCELADO transitions): cheap and self-healing,
  and idempotency makes repeated calls no-ops.
- **Adjustment modes**: `INCREASE` / `DECREASE` (purchase received, breakage) and `SET` (physical count,
  the server computes the signed delta under the product lock). A zero delta is rejected.
- **Permissions**: `manage_stock` (V19) for ADMINISTRADOR and JEFE_TALLER adjusts stock; reading movements and
  the low-stock list only needs authentication, like `GET /api/products`.
- **Optimistic locking conflicts** (`@Version`) now answer 409 with a Spanish message instead of a 500.
- **Canned job → estimate**: the frontend has no "apply canned job to estimate" flow today, so there is
  nothing to propagate yet. Canned job lines now store `productId` (and the backend/migration link them), so
  that flow will carry the link when it is built.
- **Picker behaviour**: picking a catalog product stores `productId`; typing over the name turns the line
  into free text (`productId = null`, helper "Producto libre: no mueve stock"). Linked lines show
  "Disponible: X" and warn "Supera el stock disponible (X)" without blocking.
- **Product form**: initial stock is only asked on create; on edit an info alert points to "Ajustar stock".
- **T3 native review**: high risk (security hot path in `RoleBasedAuthorizationIT`); the user chose
  "Saltear esta vez" (declined for that candidate only). Verification of record is the test evidence below.
- **Movement quantity**: positive for RESERVE/RELEASE/CONSUME/RETURN (type gives direction), signed for
  INITIAL/ADJUSTMENT.

## Out of scope (deferred by the user)
- Low-stock email notification.
- "Retirar repuestos" button on the repair order.

## Progress / evidence

Local test recipe (environment, not repo): Testcontainers 1.20.4 + Docker 29 need
`"-DargLine=-Dapi.version=1.44 -Duser.timezone=America/Argentina/Buenos_Aires"` (old default Docker API;
JVM default TZ `America/Buenos_Aires` rejected by Postgres 16). `./mvnw` from Git Bash cannot reach Maven
Central through the corporate proxy; the cached Maven 3.9.10 is used directly.

- **T1** `a63c2a7` — `mvn clean test` 507/507 ✅; `RoleBasedAuthorizationIT` 61/61 ✅ (V18 migrates,
  Hibernate `validate` passes). RDD assess: medium, `under_budget` (236 lines) → no review due.
- **T2** — RED first: `StockFlowIT` 9/14 failing before hooks (the 5 passing are "no stock effect" rows).
  GREEN after hooks: `StockFlowIT` 14/14 ✅; `mvn test` 513/513 ✅ (adds `StockServiceImplTest` 5 cases and
  hook verifications in estimate / repair order / delivery note tests).
  Native review (RDD, consent granted by the user): lineage `review-2c71e31b805bbfb5`, lens reliability,
  **approved**, acknowledged (authority burned). Advisory findings, handled in T3:
  - `R3-applytarget-toctou` (two concurrent syncs of the same source could both apply the same delta) →
    **fixed**: every sync now row-locks its source (`RepairOrderRepository/DeliveryNoteRepository.findForUpdateById`,
    `SELECT … FOR UPDATE`) before reading that source's ledger.
  - `R3-estimate-update-old-order` → **no change needed**: `EstimateServiceImpl.update` never reassigns the
    repair order, so there is no "previous order" to re-sync.
  - `R3-release-untested` → **covered**: unit test verifies `delete` calls `releaseRepairOrder`. An order that
    still has estimates cannot be deleted at all (`estimates.repair_order_id` FK without cascade), so a
    reservation can only exist on a deletable order through future rule changes.
- **T3** — `mvn test` 518/518 ✅; ITs 84/84 ✅ (`StockFlowIT` 18 incl. INITIAL movement, edit does not touch
  on hand, low-stock search, physical count; `RoleBasedAuthorizationIT` 66 incl. `manage_stock` matrix).
  RDD assess: high (security hot path) → consent relayed → user declined for this candidate.
- **T4** — `npm run lint` 0 errors (2 pre-existing warnings in `AuthContext.tsx` and `CreateRepairOrderForm.tsx`);
  `npm test` 103 files / 457 tests ✅ (new: `ProductLinesGrid`, `StockAdjustmentDialog`, `stockMovementLabels`,
  low-stock badge and stock actions in `ProductsDataGrid`); `npm run build` ✅. Found while testing: MUI fires
  `onInputChange("reset")` after `onChange` when an option is picked, which overwrote the picked product with
  the stale line; the picker now ignores `reset`.
- **T5** `87855ad` — `mvn test` 519/519 ✅ (new `givenProductsBelowMinimum_whenGetSummary_thenReturnLowStockAlerts`);
  frontend numbers above include `LowStockAlerts.test.tsx` (same run, both commits in the working tree).
  RDD assess for T4+T5 (base `ebd093a`): high (auth hot path: `permissions.ts` gained `manage_stock`) →
  consent relayed → user declined for this candidate.
