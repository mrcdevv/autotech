# Settings Panel Redesign

## Context

- **Branch**: `feature/settings-redesign`
- **Base**: `develop` (updated to `8bcf6f8`)
- **Goal**: Redesign the Configuration panel (`/configuracion`) and add workshop-wide settings that are currently missing or under-exposed.

## Scope (decided with user)

1. Redesign panel navigation (horizontal tabs → grouped lateral navigation).
2. Remove the dead "Órdenes de trabajo" tab (placeholder).
3. Expose calendar business hours (`start_time` / `end_time`) — backend already supports it.
4. Full CRUD for roles + permissions (backend currently read-only `GET /api/roles`).
5. Global default IVA (21% default, configurable) — applied to estimates/invoices.

## Paused (do NOT touch)

- Invoice numbering (correlativo) — waiting on document name decision.
- Rename "factura" → "remito" — waiting on name decision.
- Email / SMTP configuration — deferred.

## Tasks

### Task 1 — Redesign panel navigation (frontend only)
- Replace horizontal `Tabs` in `frontend/src/pages/SettingsPage.tsx` with a lateral navigation layout (grouped sections).
- Migrate the 5 functional tabs (Bank accounts, Inspection templates, Calendar, Tags, Dashboard) to sections.
- Remove `RepairOrderSettingsTab` and its test; remove the "Órdenes de trabajo" entry.
- Acceptance: panel renders lateral nav, all 5 existing sections work, dead tab gone, tests pass.

### Task 2 — Expose calendar business hours (frontend only)
- In the Calendar section, expose `startTime` / `endTime` (currently passthrough) alongside the existing duration field.
- Acceptance: user can edit business hours; `PUT /api/calendar-config` receives the values.

### Task 3 — Roles & permissions CRUD (backend + frontend)
- Backend: add `Permission` read endpoints + `Role` CRUD (create/update/delete) with permission assignment.
- Frontend: new "Accesos" section with role management UI.
- Acceptance: admin can create/edit/delete roles and assign permissions; `GET /api/roles` still used by employee/mechanic filters.

### Task 4 — Global IVA default (backend + frontend)
- Backend: add a workshop-level config holding a default IVA percentage + `GET/PUT` endpoint; apply it as the default `tax_percentage` when creating estimates/invoices.
- Frontend: new "Facturación" (or equivalent) section exposing the IVA default.
- Acceptance: setting persists; new estimates/invoices default to the configured value.

## Checks per task
- Backend: `./mvnw clean test` (Java 21).
- Frontend: `npm test` and `npm run build`.
- Each task closes with a work-unit commit (Conventional Commits).

## Commit log
- `0522f41` feat(frontend): redesign settings panel navigation with grouped sections (Task 1, superseded by single-page v2)
- `3d8ed95` feat(frontend): single-page settings layout with grouped config cards (Tasks 2 + redesign v2)
