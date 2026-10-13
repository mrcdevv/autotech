# 14 — Autorización por Roles

## 1. Overview

This feature implements **role-based authorization** for Autotech. Roles (`roles`), permissions (`permissions`) and their mapping (`role_permissions`) already exist since `V1__init_schema.sql`, but until now nothing enforced them: every authenticated employee could call every endpoint (including assigning themselves the `ADMINISTRADOR` role).

Key capabilities:

- **Permission-based authorities**: each authenticated request carries the employee's permission codes (and `ROLE_<name>`) as Spring Security authorities.
- **Endpoint enforcement**: every controller endpoint is protected with `@PreAuthorize("hasAuthority('<code>')")` according to the approved matrix (section 5).
- **Consistent error responses**: `401` (not authenticated) and `403` (no permission) are returned as JSON with the project's `ApiResponse` error shape.
- **Server-side forced password change**: while `must_change_password = true`, only the auth endpoints are reachable.
- **Self-describing session**: the login response and the new `GET /api/auth/me` return the employee's roles and permissions.
- **Permission-aware frontend**: routes, sidebar items and create/edit/delete actions are shown only when the user holds the matching permission; `403` responses are handled globally.

> **Dependencies**: Employees (spec 01), Authentication (spec 13 — implemented as JWT + `CustomUserDetailsService`).

### 1.1 Non-goals

- **Row-level rules** (e.g. "a mechanic only sees the repair orders assigned to them", "a receptionist only edits their own appointments") are **out of scope**. Authorization is per endpoint/operation only.
- Editing the permission matrix from the UI is out of scope; roles/permissions are still managed through the existing `/api/roles` endpoints (now restricted to `manage_roles`).
- Embedding permissions in the JWT. Authorities are reloaded from the database on every request, so role changes take effect immediately without re-login.

---

## 2. Git

| Item | Value |
|---|---|
| Branch (backend) | `feature/role-based-authorization` |
| Branch (frontend) | `feature/role-based-authorization-frontend` (based on the backend branch) |
| Base | `develop` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`) |

Delivered as two chained PRs: PR1 = spec + backend, PR2 = frontend.

---

## 3. DB

### 3.1 New Migration — `V11__add_manage_roles_permission.sql`

```sql
INSERT INTO permissions (code, description)
VALUES ('manage_roles', 'Gestionar roles y permisos de empleados')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMINISTRADOR'
  AND p.code = 'manage_roles'
ON CONFLICT DO NOTHING;
```

### 3.2 Referenced Tables

| Table | Purpose |
|---|---|
| `employees` | Users of the system (`status`, `must_change_password`) |
| `employee_roles` | Employee ↔ role |
| `roles` | `ADMINISTRADOR`, `JEFE_TALLER`, `MECANICO`, `RECEPCIONISTA` |
| `role_permissions` | Role ↔ permission (seeded in V1) |
| `permissions` | Permission codes (V1, invoice codes renamed to `*_delivery_note` in V9, `manage_roles` added in V11) |

---

## 4. Permission Matrix (approved)

### 4.1 Permission codes

- CRUD codes `create_*`, `read_*`, `update_*`, `delete_*` for: `client`, `employee`, `vehicle`, `order`, `inspection`, `estimate`, `delivery_note`, `payment`, `appointment`.
- Special codes: `view_reports`, `manage_config`, `manage_services`, `manage_products`, `manage_roles` (new, V11).

### 4.2 Role → permissions

| Role | Permissions |
|---|---|
| `ADMINISTRADOR` | **All** permissions, including `manage_roles`. |
| `JEFE_TALLER` | All **except** `create_employee`, `update_employee`, `delete_employee`, `manage_config`, `view_reports`, `manage_roles`. |
| `MECANICO` | `read_client`, `read_vehicle`, `read_employee`, `create_order`, `read_order`, `update_order`, `create_inspection`, `read_inspection`, `update_inspection`, `read_estimate`, `read_delivery_note`, `read_appointment`. |
| `RECEPCIONISTA` | CRUD `client`, CRUD `vehicle`, `read_employee`, `create/read/update_order`, `read_inspection`, `create/read/update_estimate`, `create/read/update_delivery_note`, CRUD `payment`, CRUD `appointment`. |

These are exactly the V1 seeds (with the V9 rename) plus `manage_roles` for `ADMINISTRADOR`. No existing mapping changes.

---

## 5. Endpoint → permission mapping

General rule: each controller maps the HTTP verb to its entity's code — `GET` → `read_*`, `POST` → `create_*`, `PUT`/`PATCH` → `update_*`, `DELETE` → `delete_*`. Read-only sub-resources (search, filters, autocomplete, export, PDF) use `read_*`.

### 5.1 Entity controllers

| Base path | Code prefix | Notes |
|---|---|---|
| `/api/clients/**` | `*_client` | `PATCH /{id}/upgrade` → `update_client`; `/search`, `/by-type`, `/autocomplete`, `/export` → `read_client` |
| `/api/employees/**` | `*_employee` | `/search`, `/filter/**`, `/export/excel` → `read_employee`; **exceptions in 5.2** |
| `/api/vehicles/**` | `*_vehicle` | `/search`, `/by-client/**`, `/filter/**` → `read_vehicle` |
| `/api/repair-orders/**` | `*_order` | `PATCH /{id}/status|notes|title`, `PUT /{id}/employees|tags` → `update_order`; `GET /{id}/estimate`, `GET /{id}/estimates` → `read_estimate`; `GET /{id}/delivery-note` → `read_delivery_note` |
| `/api/repair-orders/{id}/inspections/**` | `*_inspection` | `PUT /{id}/items` → `update_inspection` |
| `/api/estimates/**` | `*_estimate` | `PUT /{id}/approve|reject` → `update_estimate`; `GET /{id}/delivery-note-data` → `read_estimate` |
| `/api/delivery-notes/**` | `*_delivery_note` | `POST /from-estimate/{id}` → `create_delivery_note`; `GET /{id}/pdf` → `read_delivery_note` |
| `/api/delivery-notes/{id}/payments/**` | `*_payment` | `GET /summary` → `read_payment` |
| `/api/appointments/**` | `*_appointment` | `PATCH /{id}/client-arrived|vehicle-arrived|vehicle-picked-up|cancel` → `update_appointment`; `GET /range` → `read_appointment` |

### 5.2 Endpoints not covered by V1 codes (approved mapping)

| Endpoint | Rule |
|---|---|
| `/api/roles/**` (all verbs) | `manage_roles` |
| `/api/permissions/**` | `manage_roles` |
| `PUT /api/employees/{id}/roles` | `manage_roles` |
| `PUT /api/employees/{id}/reset-password` | `manage_roles` |
| `/api/tax-config`, `/api/bank-accounts/**` (incl. `/banks`), `/api/calendar-config`, `/api/tags/**`, `/api/brands/**`, `/api/vehicle-types/**` | `GET` → any authenticated; writes → `manage_config` |
| `/api/canned-jobs/**`, `/api/common-problems/**`, `/api/inspection-templates/**` (incl. `POST /{id}/duplicate`) | `GET` → any authenticated; writes → `manage_services` |
| `/api/services/**` | `GET` → any authenticated; writes → `manage_services` |
| `/api/products/**` | `GET` → any authenticated; writes → `manage_products` |
| `/api/dashboard/**` (summary, financiero, productividad, config, exports) | any authenticated |
| `/api/dashboard/reports/**` | `view_reports` |

### 5.3 Auth endpoints

| Endpoint | Rule |
|---|---|
| `POST /api/auth/login` | public |
| `POST /api/auth/password-recovery` | public |
| `PUT /api/auth/change-password` | authenticated (removed from `permitAll`; previously threw an NPE → 500 without a token) |
| `GET /api/auth/me` | authenticated |

> "Any authenticated" endpoints use `@PreAuthorize("isAuthenticated()")` so every controller method is annotated explicitly; the URL-level `anyRequest().authenticated()` remains as a safety net.

---

## 6. Backend

### 6.1 Authorities — `CustomUserDetailsService`

- Loads the employee with `roles` and `roles.permissions` in one query (`@EntityGraph(attributePaths = {"roles", "roles.permissions"})` on `EmployeeRepository.findWithRolesAndPermissionsByEmail`). Both collections are `Set`, so no `MultipleBagFetchException`.
- Authorities = `ROLE_<ROLE_NAME>` for every role **plus** every distinct permission `code`.
- Returns `AuthenticatedEmployee` (extends Spring's `User`) which also exposes `mustChangePassword`.
- `enabled` = `status == ACTIVO`.

### 6.2 `JwtAuthenticationFilter`

- If the token is valid but the employee is disabled or no longer exists, the request stays unauthenticated (→ `401`).
- **Forced password change**: if `mustChangePassword` is true and the request path is not under `/api/auth/`, respond `403` with:

```json
{ "status": "error", "message": "Debe cambiar su contraseña antes de continuar", "data": { "code": "PASSWORD_CHANGE_REQUIRED" } }
```

### 6.3 `SecurityConfig`

```java
.authorizeHttpRequests(authz -> authz
        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/password-recovery").permitAll()
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .anyRequest().authenticated())
.exceptionHandling(ex -> ex
        .authenticationEntryPoint(restAuthenticationEntryPoint)   // 401 JSON
        .accessDeniedHandler(restAccessDeniedHandler))            // 403 JSON
```

Both handlers write `ApiResponse.error(...)` with Spanish messages:

| Status | Message |
|---|---|
| 401 | `No autenticado. Inicie sesión para continuar` |
| 403 | `No tiene permisos para realizar esta acción` |

### 6.4 `GlobalExceptionHandler` additions

`@PreAuthorize` throws inside the dispatcher, so the `@RestControllerAdvice` catch-all would turn it into a 500. New handlers:

| Exception | Status |
|---|---|
| `AccessDeniedException` (incl. `AuthorizationDeniedException`) | 403 |
| `DisabledException` (inactive employee logging in) | 401, generic `Credenciales inválidas` (does not reveal account state) |
| other `AuthenticationException` | 401 |
| `NoResourceFoundException` (unknown URL) | 404 |

### 6.5 DTOs and `GET /api/auth/me`

`LoginResponse` gains `roles: List<String>` and `permissions: List<String>` (sorted). New record:

```java
public record CurrentUserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        boolean mustChangePassword,
        List<String> roles,
        List<String> permissions) {}
```

`GET /api/auth/me` → `ApiResponse<CurrentUserResponse>`; built by `AuthService.getCurrentUser(email)`.

---

## 7. Frontend

- `AuthContext` stores `roles` and `permissions` (from login, refreshed with `GET /api/auth/me` on app load) and exposes `hasPermission(code)` / `hasAnyPermission(codes)`.
- `PrivateRoute` accepts an optional `permission` (or list) and renders a "Sin permisos" page (`No tiene permisos para acceder a esta sección`) when missing.
- `Sidebar` items declare the permission needed and are hidden otherwise (e.g. Reportes → `view_reports`, Empleados → `read_employee`, Configuración → `manage_config`).
- Create/edit/delete buttons are hidden without the matching `create_*`/`update_*`/`delete_*` (or `manage_*`) code.
- `api/client.ts` handles `403`: `PASSWORD_CHANGE_REQUIRED` redirects to `/change-password`; otherwise a global notification `No tiene permisos para realizar esta acción` is shown.

| Route | Permission |
|---|---|
| `/` | any authenticated |
| `/empleados` | `read_employee` |
| `/clientes` | `read_client` |
| `/vehiculos` | `read_vehicle` |
| `/calendario` | `read_appointment` |
| `/ordenes-trabajo`, `/ordenes-trabajo/:id` | `read_order` |
| `/ordenes-trabajo/nueva` | `create_order` |
| `/presupuestos/**` | `read_estimate` |
| `/remitos/**` | `read_delivery_note` |
| `/servicios`, `/paquetes-de-servicios`, `/configuracion/plantillas-inspeccion/**`, `/configuracion/problemas-comunes` | `manage_services` |
| `/productos` | `manage_products` |
| `/reportes` | `view_reports` |
| `/configuracion` | `manage_config` |

---

## 8. Tests

### 8.1 Backend

- **Integration tests** (`*IT`, `@SpringBootTest` + `@AutoConfigureMockMvc`, profile `test` → Testcontainers PostgreSQL, run by `maven-failsafe-plugin` on `./mvnw verify`). Tests create one employee per role, issue a real JWT and call the API through the full filter chain:
  - Regression: `MECANICO` cannot `PUT /api/employees/{self}/roles` → 403 and roles are unchanged.
  - Per role allowed/denied samples (e.g. `MECANICO` can read clients but cannot create them; `RECEPCIONISTA` cannot read reports; `JEFE_TALLER` cannot create roles; `ADMINISTRADOR` can).
  - 401 JSON without token; `change-password` without token → 401.
  - Inactive employee login → 401; unknown URL → 404.
  - `mustChangePassword` employee → 403 `PASSWORD_CHANGE_REQUIRED` on business endpoints, 200 on `/api/auth/me`.
  - Login and `/me` include roles and permissions.
- **Unit tests**: `CustomUserDetailsService` authorities, `AuthServiceImpl.getCurrentUser`.
- Existing `@WebMvcTest` controller tests run with a mock user holding every permission (`@WithMockUser(authorities = ...)`).

### 8.2 Frontend

- `npm run build` and `npm run lint` pass.
