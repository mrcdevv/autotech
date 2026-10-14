# Role-Based Authorization

## Context

- **Spec**: `docs/specs/14-autorizacion-roles.md`
- **Branches**: `feature/role-based-authorization` (spec + backend, PR1) → `feature/role-based-authorization-frontend` (frontend, PR2, based on PR1)
- **Base**: `develop`
- **Problem**: roles and permissions existed (V1) but nothing enforced them. Any authenticated employee (even `MECANICO`) could read/write everything, including `PUT /api/employees/{self}/roles` with the `ADMINISTRADOR` id.

## Checklist

- [x] T0 — Spec `docs/specs/14-autorizacion-roles.md` (commit `72623e7`)
- [x] T1 — V11 `manage_roles` permission + permission codes / `ROLE_` names as authorities in `CustomUserDetailsService`
- [x] T2 — `@PreAuthorize` on every endpoint, 401/403 JSON handlers, `DisabledException` / `NoResourceFoundException` / change-password without token
- [x] T3 — Server-side `mustChangePassword` enforcement
- [x] T4 — Roles + permissions in login response, `GET /api/auth/me`
- [x] T6 — Per-role integration tests (incl. MECANICO self-escalation regression)
- [x] T5 — Frontend: permissions in `AuthContext`, route guard, Sidebar filter, action buttons, 403 handling

## Commits

| Task | Commit |
|---|---|
| T0 | `72623e7` docs: add role-based authorization spec |
| T1 | `922c515` feat: load role permissions as authorities and add manage_roles permission |
| T2 | `7cca5c9` feat: enforce permission-based authorization on all API endpoints |
| T3 | `704b664` feat: enforce mustChangePassword on the server |
| T4 | `2342946` feat: return roles and permissions on login and add GET /api/auth/me |
| T6 | `818d53e` test: add per-role authorization integration tests |
| T5 | `4bd7e51` feat: permission-aware frontend for role-based authorization |

## Notes

- Docker is not available in the cloud session, so `RoleBasedAuthorizationIT` ran against a local PostgreSQL 16 by overriding the `test` profile datasource with `SPRING_DATASOURCE_*` environment variables. On a machine with Docker, `./mvnw clean verify` uses Testcontainers as configured.
- `@Valid` request bodies are validated before `@PreAuthorize`, so a denied caller sending an invalid body gets 400 instead of 403 (documented in the spec).
- Frontend detail screens (repair order, estimate, remito detail) are gated by route only; unauthorized writes there are rejected by the backend and surfaced by the global 403 notification.
