# Remito (DeliveryNote) — rename + correlativo + remove IVA

## Context

- **Branch**: `feature/remito-delivery-note` (stacked on `feature/settings-redesign` — merge settings-redesign first)
- **Base**: `6c6fc1f` (settings-redesign, contains global IVA config)
- **Goal**: Rename the "Factura" concept to "Remito" (delivery note), add a sequential correlativo number, and remove IVA from remitos (estimates keep IVA).

## Decisions (locked with user)

1. **Full technical rename**: `Invoice` → `DeliveryNote`.
   - Package `com.autotech.invoice` → `com.autotech.deliverynote`
   - Tables `invoices` → `delivery_notes`, `invoice_services` → `delivery_note_services`, `invoice_products` → `delivery_note_products`
   - FK columns `invoice_id` → `delivery_note_id` (incl. `payments.invoice_id`)
   - Endpoint `/api/invoices` → `/api/delivery-notes`; frontend route `/facturas` → `/remitos`
2. **Correlativo**: new sequential `number` (BIGINT) via DB sequence, displayed zero-padded (8 digits).
3. **IVA**: remitos get 0% IVA. Estimates keep 21% (TaxConfig unchanged).

## Tasks

### Task 1 — Backend rename (Invoice → DeliveryNote)
- Migration `V9`: rename tables + FK columns + update permission descriptions that say "factura".
- Rename package, entity, repositories, service (+impl), controller, DTOs, mapper, PDF service, enum `InvoiceStatus` → `DeliveryNoteStatus`.
- Update cross-module references: payment, dashboard, email, estimate.
- Endpoint `/api/delivery-notes`; PDF filename `remito-{number}.pdf` (or keep id).
- Acceptance: `./mvnw clean test` green (405+ tests, 0 errors).

### Task 2 — Correlativo + IVA 0% (backend)
- Migration `V10`: `CREATE SEQUENCE delivery_note_number_seq`; add `number` column + backfill + NOT NULL + UNIQUE.
- Add `number` to entity, DTOs, mapper; generate via `nextval` in service (create + createFromEstimate).
- Replace `String.format("%08d", id)` in PDF with `number`.
- Force `taxPercentage = 0` in `DeliveryNoteServiceImpl` (create + createFromEstimate); update `PaymentServiceImpl.getSummary` and `DeliveryNotePdfServiceImpl.buildTotals` to not compute tax.
- Acceptance: `./mvnw clean test` green; new tests cover correlativo + 0% IVA.

### Task 3 — Frontend rename + correlativo + IVA (UI)
- Rename api (`invoices.ts` → `deliveryNotes.ts`), types, hooks, `features/invoices` → `features/delivery-notes`, pages `InvoicesPage` → `DeliveryNotesPage`, `InvoiceDetailPage` → `DeliveryNoteDetailPage`.
- Routes `/facturas` → `/remitos`.
- All Spanish labels "Factura"/"factura" → "Remito"/"remito"; PDF download filename; sidebar/topbar/dashboard/payments/repair-orders/estimates references.
- Show correlativo `number` in list + detail; remove "Impuestos"/tax display in summary/payment summary.
- Acceptance: `npm test` + `npm run build` green.

## Checks per task
- Backend: `./mvnw clean test` (Testcontainers PostgreSQL 16).
- Frontend: `npm test`, `npm run build`.
- Work-unit commits (Conventional Commits) on the feature branch.

## Out of scope
- Renaming status enum values (PENDIENTE/PAGADA stay).
- `docs/` specs update (flag only).
- Invoice → delivery-note in payment domain model semantics beyond the rename.

## Commit log

- `ae94e54` refactor(backend): rename Invoice to DeliveryNote (migration V9 + package + classes + endpoint)
- `f12fc28` feat(backend): add correlativo number and remove IVA from delivery notes (migration V10)
- `094aeb2` feat(frontend): rename facturas to remitos, show correlativo, remove IVA
- `ec34d2e` feat(frontend): show correlativo number in remito list and detail

## Verification
- Backend: `./mvnw clean test` → 403 tests, 0 failures, 0 errors ✅
- Frontend: `npm test` → 232 tests ✅ · `npm run build` → OK ✅

## Out of scope / follow-ups
- `docs/` specs still mention "factura" (not updated).
- Dashboard "Facturación" labels were renamed to "Remitos" in code; verify wording with user if needed.
