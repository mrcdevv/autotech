# 01 — Gestión de Empleados

## 1. Overview

This feature provides full CRUD management for employees of the mechanical workshop. Employees have personal data, contact information, and one or more roles (ADMINISTRADOR, JEFE_TALLER, MECANICO, RECEPCIONISTA). The UI presents a paginated data grid (max 12 rows) with filters by DNI, role, and status (ACTIVO/INACTIVO), plus the ability to export the list to Excel.

> **Deferred**: Username and password fields are part of authentication and will be addressed in `13-autenticacion.md`. This spec does **not** include those fields.

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/gestion-empleados` |
| Base | `develop` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add Employee entity and Flyway migration`
- `feat: add employee CRUD endpoints`
- `feat: add EmployeesPage with DataGrid`
- `test: add unit tests for EmployeeService`

---

## 3. DB Tables

The feature relies on the following tables from `V1__init_schema.sql`:

### `employees`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `first_name` | `VARCHAR(100)` | NOT NULL |
| `last_name` | `VARCHAR(100)` | NOT NULL |
| `dni` | `VARCHAR(20)` | NOT NULL, UNIQUE |
| `email` | `VARCHAR(255)` | — |
| `phone` | `VARCHAR(20)` | NOT NULL |
| `address` | `VARCHAR(255)` | — |
| `province` | `VARCHAR(100)` | — |
| `country` | `VARCHAR(100)` | — |
| `marital_status` | `VARCHAR(20)` | — |
| `children_count` | `INTEGER` | NOT NULL, DEFAULT 0 |
| `entry_date` | `DATE` | — |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'ACTIVO'`, CHECK (`ACTIVO`, `INACTIVO`) |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

### `employee_roles` (join table)

| Column | Type | Constraints |
|---|---|---|
| `employee_id` | `BIGINT` | FK → `employees(id)` ON DELETE CASCADE, PK |
| `role_id` | `BIGINT` | FK → `roles(id)` ON DELETE CASCADE, PK |

### `roles` (referenced)

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(50)` | NOT NULL, UNIQUE |
| `description` | `VARCHAR(255)` | — |

Seed roles: `ADMINISTRADOR`, `JEFE_TALLER`, `MECANICO`, `RECEPCIONISTA`.

---

## 4. Backend

Package: `com.autotech.employee`

### 4.1 Enum — `EmployeeStatus`

```java
package com.autotech.employee.model;

public enum EmployeeStatus {
    ACTIVO,
    INACTIVO
}
```

### 4.2 Entity — `Employee`

Location: `com.autotech.employee.model.Employee`

```java
@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Employee extends BaseEntity {

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "dni", nullable = false, unique = true, length = 20)
    private String dni;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "marital_status", length = 20)
    private String maritalStatus;

    @Column(name = "children_count", nullable = false)
    @Builder.Default
    private Integer childrenCount = 0;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EmployeeStatus status = EmployeeStatus.ACTIVO;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "employee_roles",
        joinColumns = @JoinColumn(name = "employee_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Employee other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

> **Note**: `Role` is the existing entity from `com.autotech.role.model.Role` (or `com.autotech.common.model.Role` depending on where roles are placed). It maps to the `roles` table.

### 4.3 Repository — `EmployeeRepository`

Location: `com.autotech.employee.repository.EmployeeRepository`

```java
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByDni(String dni);

    boolean existsByDniAndIdNot(String dni, Long id);

    Optional<Employee> findByDni(String dni);

    @EntityGraph(attributePaths = {"roles"})
    Optional<Employee> findWithRolesById(Long id);

    Page<Employee> findByStatus(EmployeeStatus status, Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.dni) LIKE LOWER(CONCAT('%', :dni, '%'))")
    Page<Employee> searchByDni(@Param("dni") String dni, Pageable pageable);

    @Query("""
        SELECT DISTINCT e FROM Employee e
        JOIN e.roles r
        WHERE r.id = :roleId
    """)
    Page<Employee> findByRoleId(@Param("roleId") Long roleId, Pageable pageable);

    @EntityGraph(attributePaths = {"roles"})
    Page<Employee> findAll(Pageable pageable);
}
```

### 4.4 DTOs

Location: `com.autotech.employee.dto`

#### `EmployeeRequest`

```java
public record EmployeeRequest(

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no debe superar los 100 caracteres")
    String firstName,

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100, message = "El apellido no debe superar los 100 caracteres")
    String lastName,

    @NotBlank(message = "El DNI es obligatorio")
    @Size(max = 20, message = "El DNI no debe superar los 20 caracteres")
    String dni,

    @Email(message = "El formato del correo electrónico no es válido")
    @Size(max = 255, message = "El correo no debe superar los 255 caracteres")
    String email,

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 20, message = "El teléfono no debe superar los 20 caracteres")
    String phone,

    @Size(max = 255, message = "La dirección no debe superar los 255 caracteres")
    String address,

    @Size(max = 100, message = "La provincia no debe superar los 100 caracteres")
    String province,

    @Size(max = 100, message = "El país no debe superar los 100 caracteres")
    String country,

    @Size(max = 20, message = "El estado civil no debe superar los 20 caracteres")
    String maritalStatus,

    @NotNull(message = "La cantidad de hijos es obligatoria")
    @Min(value = 0, message = "La cantidad de hijos no puede ser negativa")
    Integer childrenCount,

    LocalDate entryDate,

    @NotNull(message = "El estado es obligatorio")
    EmployeeStatus status,

    @NotEmpty(message = "Debe asignar al menos un rol")
    List<Long> roleIds
) {}
```

#### `EmployeeResponse`

```java
public record EmployeeResponse(
    Long id,
    String firstName,
    String lastName,
    String dni,
    String email,
    String phone,
    String address,
    String province,
    String country,
    String maritalStatus,
    Integer childrenCount,
    LocalDate entryDate,
    EmployeeStatus status,
    List<RoleResponse> roles,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

#### `RoleResponse` (shared, likely already exists or in common)

```java
public record RoleResponse(
    Long id,
    String name,
    String description
) {}
```

### 4.5 Mapper — `EmployeeMapper`

Location: `com.autotech.employee.dto.EmployeeMapper`

> **Important**: Use a manual `@Component` class, NOT a MapStruct `@Mapper` interface. MapStruct's generated code is corrupted by VS Code's JDT background compiler, which cannot resolve Lombok-generated methods inherited from `BaseEntity`. See `backend/.agentic-rules/dto-rules.md` for details.

```java
@Component
public class EmployeeMapper {

    public EmployeeResponse toResponse(Employee entity) {
        if (entity == null) return null;

        List<RoleResponse> roles = entity.getRoles().stream()
                .map(this::toRoleResponse)
                .toList();

        return new EmployeeResponse(
                entity.getId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getDni(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getAddress(),
                entity.getProvince(),
                entity.getCountry(),
                entity.getMaritalStatus(),
                entity.getChildrenCount(),
                entity.getEntryDate(),
                entity.getStatus(),
                roles,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public Employee toEntity(EmployeeRequest request) {
        if (request == null) return null;

        return Employee.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .dni(request.dni())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .province(request.province())
                .country(request.country())
                .maritalStatus(request.maritalStatus())
                .childrenCount(request.childrenCount())
                .entryDate(request.entryDate())
                .status(request.status())
                .build();
    }

    public RoleResponse toRoleResponse(Role role) {
        if (role == null) return null;
        return new RoleResponse(role.getId(), role.getName(), role.getDescription());
    }

    public List<EmployeeResponse> toResponseList(List<Employee> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }
}
```

### 4.6 Service — `EmployeeService`

Location: `com.autotech.employee.service.EmployeeService`

```java
public interface EmployeeService {

    Page<EmployeeResponse> getAll(Pageable pageable);

    EmployeeResponse getById(Long id);

    EmployeeResponse create(EmployeeRequest request);

    EmployeeResponse update(Long id, EmployeeRequest request);

    void delete(Long id);

    Page<EmployeeResponse> searchByDni(String dni, Pageable pageable);

    Page<EmployeeResponse> filterByStatus(EmployeeStatus status, Pageable pageable);

    Page<EmployeeResponse> filterByRole(Long roleId, Pageable pageable);

    EmployeeResponse assignRoles(Long employeeId, List<Long> roleIds);

    byte[] exportToExcel();
}
```

#### `EmployeeServiceImpl`

Location: `com.autotech.employee.service.EmployeeServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;
    private final RoleRepository roleRepository;  // injected to resolve roles by id

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> getAll(Pageable pageable) { ... }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getById(Long id) { ... }

    @Override
    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        // 1. Validate DNI uniqueness via existsByDni()
        // 2. Map request to entity
        // 3. Resolve roles from roleIds
        // 4. Save and return response
    }

    @Override
    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        // 1. Find employee or throw ResourceNotFoundException
        // 2. Validate DNI uniqueness (excluding current employee) via existsByDniAndIdNot()
        // 3. Update fields
        // 4. Resolve and reassign roles
        // 5. Save and return response
    }

    @Override
    @Transactional
    public void delete(Long id) {
        // 1. Find employee or throw ResourceNotFoundException
        // 2. Delete
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> searchByDni(String dni, Pageable pageable) { ... }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> filterByStatus(EmployeeStatus status, Pageable pageable) { ... }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> filterByRole(Long roleId, Pageable pageable) { ... }

    @Override
    @Transactional
    public EmployeeResponse assignRoles(Long employeeId, List<Long> roleIds) {
        // 1. Find employee or throw ResourceNotFoundException
        // 2. Resolve roles from roleIds (throw if any role not found)
        // 3. Clear existing roles and assign new ones
        // 4. Save and return response
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportToExcel() {
        // 1. Fetch all employees with roles
        // 2. Build Excel workbook using Apache POI
        // 3. Return byte array
    }
}
```

### 4.7 Controller — `EmployeeController`

Location: `com.autotech.employee.controller.EmployeeController`

Base path: `/api/employees`

```java
@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    // GET /api/employees?page=0&size=12&sort=lastName,asc
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getAll(pageable)));
    }

    // GET /api/employees/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getById(id)));
    }

    // POST /api/employees
    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse created = employeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Empleado creado", created));
    }

    // PUT /api/employees/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Empleado actualizado", employeeService.update(id, request)));
    }

    // DELETE /api/employees/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Empleado eliminado", null));
    }

    // GET /api/employees/search?dni=123&page=0&size=12
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> searchByDni(
            @RequestParam String dni, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.searchByDni(dni, pageable)));
    }

    // GET /api/employees/filter/status?status=ACTIVO&page=0&size=12
    @GetMapping("/filter/status")
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> filterByStatus(
            @RequestParam EmployeeStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.filterByStatus(status, pageable)));
    }

    // GET /api/employees/filter/role?roleId=1&page=0&size=12
    @GetMapping("/filter/role")
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> filterByRole(
            @RequestParam Long roleId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.filterByRole(roleId, pageable)));
    }

    // PUT /api/employees/{id}/roles
    @PutMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<EmployeeResponse>> assignRoles(
            @PathVariable Long id,
            @Valid @RequestBody List<Long> roleIds) {
        return ResponseEntity.ok(ApiResponse.success("Roles actualizados", employeeService.assignRoles(id, roleIds)));
    }

    // GET /api/employees/export/excel
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportToExcel() {
        byte[] file = employeeService.exportToExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=empleados.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(file);
    }
}
```

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/employees?page=0&size=12` | List all employees (paginated) |
| `GET` | `/api/employees/{id}` | Get employee by ID |
| `POST` | `/api/employees` | Create new employee |
| `PUT` | `/api/employees/{id}` | Update employee |
| `DELETE` | `/api/employees/{id}` | Delete employee |
| `GET` | `/api/employees/search?dni=...` | Search by DNI (partial match) |
| `GET` | `/api/employees/filter/status?status=ACTIVO` | Filter by status |
| `GET` | `/api/employees/filter/role?roleId=1` | Filter by role |
| `PUT` | `/api/employees/{id}/roles` | Assign roles to employee |
| `GET` | `/api/employees/export/excel` | Export all employees as `.xlsx` |

---

## 5. Frontend

### 5.1 Types

Location: `src/features/employees/types.ts`

```typescript
// Employee status
type EmployeeStatus = "ACTIVO" | "INACTIVO";

// Role (shared, may live in src/types/role.ts)
interface RoleResponse {
  id: number;
  name: string;
  description: string;
}

// Response from the API
interface EmployeeResponse {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  email: string | null;
  phone: string;
  address: string | null;
  province: string | null;
  country: string | null;
  maritalStatus: string | null;
  childrenCount: number;
  entryDate: string | null;      // ISO date string
  status: EmployeeStatus;
  roles: RoleResponse[];
  createdAt: string;             // ISO datetime string
  updatedAt: string;             // ISO datetime string
}

// Request payload for create/update
interface EmployeeRequest {
  firstName: string;
  lastName: string;
  dni: string;
  email: string | null;
  phone: string;
  address: string | null;
  province: string | null;
  country: string | null;
  maritalStatus: string | null;
  childrenCount: number;
  entryDate: string | null;      // ISO date string
  status: EmployeeStatus;
  roleIds: number[];
}
```

### 5.2 API

Location: `src/api/employees.ts`

```typescript
import apiClient from "./client";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { EmployeeResponse, EmployeeRequest } from "@/features/employees/types";

export const employeesApi = {
  getAll: (page: number, size: number = 12) =>
    apiClient.get<ApiResponse<PageResponse<EmployeeResponse>>>("/employees", {
      params: { page, size },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<EmployeeResponse>>(`/employees/${id}`),

  create: (data: EmployeeRequest) =>
    apiClient.post<ApiResponse<EmployeeResponse>>("/employees", data),

  update: (id: number, data: EmployeeRequest) =>
    apiClient.put<ApiResponse<EmployeeResponse>>(`/employees/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/employees/${id}`),

  searchByDni: (dni: string, page: number, size: number = 12) =>
    apiClient.get<ApiResponse<PageResponse<EmployeeResponse>>>("/employees/search", {
      params: { dni, page, size },
    }),

  filterByStatus: (status: string, page: number, size: number = 12) =>
    apiClient.get<ApiResponse<PageResponse<EmployeeResponse>>>("/employees/filter/status", {
      params: { status, page, size },
    }),

  filterByRole: (roleId: number, page: number, size: number = 12) =>
    apiClient.get<ApiResponse<PageResponse<EmployeeResponse>>>("/employees/filter/role", {
      params: { roleId, page, size },
    }),

  assignRoles: (id: number, roleIds: number[]) =>
    apiClient.put<ApiResponse<EmployeeResponse>>(`/employees/${id}/roles`, roleIds),

  exportToExcel: () =>
    apiClient.get<Blob>("/employees/export/excel", {
      responseType: "blob",
    }),
};
```

### 5.3 Hooks

Location: `src/features/employees/`

#### `useEmployees.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { employeesApi } from "@/api/employees";
import type { EmployeeResponse } from "@/features/employees/types";
import type { PageResponse } from "@/types/api";

export function useEmployees() {
  const [employees, setEmployees] = useState<PageResponse<EmployeeResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesApi.getAll(page);
      setEmployees(res.data.data);
    } catch (err) {
      setError("Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  return { employees, loading, error, page, setPage, refetch: fetchEmployees };
}
```

#### `useEmployee.ts`

```typescript
import { useState, useEffect } from "react";
import { employeesApi } from "@/api/employees";
import type { EmployeeResponse } from "@/features/employees/types";

export function useEmployee(id: number) {
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    employeesApi.getById(id)
      .then((res) => setEmployee(res.data.data))
      .catch(() => setError("Error al cargar el empleado"))
      .finally(() => setLoading(false));
  }, [id]);

  return { employee, loading, error };
}
```

### 5.4 Pages

Location: `src/pages/EmployeesPage.tsx`

Route: `/empleados`

```typescript
import { Box, Typography, Button } from "@mui/material";
import { Add as AddIcon, FileDownload as ExportIcon } from "@mui/icons-material";

import { EmployeeList } from "@/features/employees/EmployeeList";
import { EmployeeForm } from "@/features/employees/EmployeeForm";
import { EmployeeFilters } from "@/features/employees/EmployeeFilters";

export default function EmployeesPage() {
  // State: formOpen, selectedEmployee, filters
  // Handlers: handleCreate, handleEdit, handleDelete, handleExport, handleFilterChange
  return (
    <Box>
      <Typography variant="h4">Gestión de Empleados</Typography>
      <Box /* toolbar */>
        <EmployeeFilters onFilterChange={handleFilterChange} />
        <Button startIcon={<ExportIcon />}>Exportar a Excel</Button>
        <Button variant="contained" startIcon={<AddIcon />}>Nuevo Empleado</Button>
      </Box>
      <EmployeeList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />
      <EmployeeForm
        open={formOpen}
        employee={selectedEmployee}
        onClose={handleCloseForm}
        onSave={handleSave}
      />
    </Box>
  );
}
```

### 5.5 Components

#### `EmployeeList`

Location: `src/features/employees/EmployeeList.tsx`

- Uses MUI `DataGrid` from `@mui/x-data-grid`
- Columns: `Documento` (dni), `Nombre Completo` (firstName + lastName), `Teléfono` (phone), `Correo Electrónico` (email), `Estado` (status with `Chip` — green for ACTIVO, red for INACTIVO), `Acción` (IconButtons for edit, delete, view)
- Pagination: `pageSize={12}`, server-side pagination via `paginationMode="server"`
- Row count from `Page.totalElements`

```typescript
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { Chip } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from "@mui/icons-material";

// Columns definition
const columns: GridColDef[] = [
  { field: "dni", headerName: "Documento", flex: 1 },
  {
    field: "fullName",
    headerName: "Nombre Completo",
    flex: 1.5,
    valueGetter: (params) => `${params.row.firstName} ${params.row.lastName}`,
  },
  { field: "phone", headerName: "Teléfono", flex: 1 },
  { field: "email", headerName: "Correo Electrónico", flex: 1.5 },
  {
    field: "status",
    headerName: "Estado",
    flex: 0.8,
    renderCell: (params) => (
      <Chip
        label={params.value === "ACTIVO" ? "Activo" : "Inactivo"}
        color={params.value === "ACTIVO" ? "success" : "error"}
        size="small"
      />
    ),
  },
  {
    field: "actions",
    type: "actions",
    headerName: "Acción",
    flex: 1,
    getActions: (params) => [
      <GridActionsCellItem icon={<ViewIcon />} label="Ver" onClick={() => onView(params.row)} />,
      <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => onEdit(params.row)} />,
      <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => onDelete(params.row.id)} />,
    ],
  },
];
```

#### `EmployeeForm`

Location: `src/features/employees/EmployeeForm.tsx`

- Uses MUI `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`
- Form fields (all MUI components):
  - `TextField` — Nombre (firstName)
  - `TextField` — Apellido (lastName)
  - `TextField` — DNI (dni)
  - `TextField` — Correo Electrónico (email), type="email"
  - `TextField` — Teléfono (phone)
  - `TextField` — Dirección (address)
  - `TextField` — Provincia (province)
  - `TextField` — País (country)
  - `TextField` — Estado Civil (maritalStatus)
  - `TextField` — Cantidad de Hijos (childrenCount), type="number"
  - `DatePicker` (from `@mui/x-date-pickers`) — Fecha de Entrada (entryDate)
  - `Select` / `Autocomplete` — Cargo/Rol (roleIds) — dropdown with available roles fetched from backend
  - `Select` — Estado (status) — options: Activo, Inactivo
- `Button` — Guardar / Cancelar
- Validates DNI uniqueness on blur (calls API or shows error from backend 409 response)
- Validates email format client-side

> **Deferred fields**: `username` and `password` will be added in `13-autenticacion.md`.

#### `EmployeeFilters`

Location: `src/features/employees/EmployeeFilters.tsx`

- Uses MUI `TextField`, `Select`, `MenuItem`, `Box`/`Stack` for layout
- Filters:
  - `TextField` — Buscar por DNI (search input, triggers on Enter or debounced)
  - `Select` — Filtrar por Cargo (role dropdown, loaded from `/api/roles`)
  - `Select` — Filtrar por Estado (status dropdown: Todos, Activo, Inactivo)
- Emits filter changes via `onFilterChange` prop to parent

### 5.6 Routes

Location: `src/routes/`

```typescript
{
  path: "/empleados",
  element: <EmployeesPage />,
}
```

Lazy loaded via `React.lazy(() => import("@/pages/EmployeesPage"))`.

---

## 6. Business Rules

| # | Rule | Implementation |
|---|---|---|
| 1 | **DNI must be unique** | Backend: `existsByDni()` on create, `existsByDniAndIdNot()` on update. Throw `DuplicateResourceException` (HTTP 409) with message "Ya existe un empleado con el DNI ingresado". Frontend: show error from API response. |
| 2 | **Email format validation** | Backend: `@Email` annotation on `EmployeeRequest.email`. Frontend: `type="email"` on `TextField` + client-side regex. |
| 3 | **Status values** | Only `ACTIVO` or `INACTIVO`. Enforced by the `EmployeeStatus` enum and DB CHECK constraint. |
| 4 | **At least one role required** | Backend: `@NotEmpty` on `roleIds` in `EmployeeRequest`. Frontend: disable submit button if no role selected. |
| 5 | **Role IDs must exist** | Backend: service resolves each `roleId` — if any is not found, throw `ResourceNotFoundException` (HTTP 404) with message "No se encontró el rol con ID {id}". |
| 6 | **Soft delete consideration** | Currently hard delete. If soft delete is needed in the future, set `status = INACTIVO` instead. For now, `DELETE` physically removes the record. Employee roles are cascade-deleted by the DB FK constraint. |
| 7 | **Pagination default** | Default page size is 12 rows. Frontend sends `size=12`. Backend accepts any `Pageable` but the UI enforces 12. |
| 8 | **Export to Excel** | Exports all employees (no pagination) with columns: DNI, Nombre Completo, Teléfono, Email, Estado, Roles. Uses Apache POI (`XSSFWorkbook`). |
| 9 | **Username/Password** | Deferred to `13-autenticacion.md`. Not included in this feature. |

---

## 7. Testing

> **Note**: Tests are listed here for reference but will only be implemented after manual approval.

### 7.1 Backend — Unit Tests

| Test Class | What it covers |
|---|---|
| `EmployeeServiceImplTest` | Unit tests with Mockito for all service methods: create (happy path + duplicate DNI), update (happy path + not found + duplicate DNI), delete (happy path + not found), getAll, getById, searchByDni, filterByStatus, filterByRole, assignRoles, exportToExcel |
| `EmployeeControllerTest` | `@WebMvcTest` with mocked service. Tests all endpoints: response codes, validation errors (missing required fields, invalid email), pagination params, content-type for Excel export |
| `EmployeeMapperTest` | Verifies `toResponse`, `toEntity`, and `toResponseList` mappings are correct |

### 7.2 Backend — Integration Tests

| Test Class | What it covers |
|---|---|
| `EmployeeRepositoryTest` | `@DataJpaTest` with embedded/Testcontainers PostgreSQL. Tests `existsByDni`, `findByStatus`, `searchByDni`, `findByRoleId`, `findWithRolesById` |
| `EmployeeIntegrationTest` | Full Spring Boot test (`@SpringBootTest` + Testcontainers). Tests full create → read → update → delete flow via HTTP |

### 7.3 Frontend — Unit Tests

| Test File | What it covers |
|---|---|
| `EmployeeList.test.tsx` | Renders DataGrid with mock data, correct columns displayed, pagination controls, action buttons fire callbacks |
| `EmployeeForm.test.tsx` | Form renders all fields, validation errors shown (empty required fields, invalid email), submits correct payload |
| `EmployeeFilters.test.tsx` | Filter inputs render, onChange callbacks fire with correct values |
| `useEmployees.test.ts` | Hook fetches data, handles loading/error states, pagination changes trigger refetch |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend

- [x] Create `EmployeeStatus` enum (`ACTIVO`, `INACTIVO`)
- [x] Create `Employee` entity with all fields and `@ManyToMany` relationship to `Role`
- [x] Create `EmployeeRepository` with all query methods (`existsByDni`, `existsByDniAndIdNot`, `findByDni`, `findWithRolesById`, `findByStatus`, `searchByDni`, `findByRoleId`, `findAll` with `@EntityGraph`)
- [x] Create `EmployeeRequest` DTO (record) with Jakarta Validation annotations
- [x] Create `EmployeeResponse` DTO (record)
- [x] Create `RoleResponse` DTO (record, if not already existing)
- [x] Create `EmployeeMapper` as a manual `@Component` class (NOT MapStruct)
- [x] Create `EmployeeService` interface with all method signatures
- [x] Create `EmployeeServiceImpl` with full implementations:
  - [x] `getAll` — paginated list with roles
  - [x] `getById` — single employee with roles
  - [x] `create` — DNI uniqueness check, role resolution, save
  - [x] `update` — find or 404, DNI uniqueness (excluding self), update fields and roles
  - [x] `delete` — find or 404, delete
  - [x] `searchByDni` — partial match search
  - [x] `filterByStatus` — filter by `ACTIVO`/`INACTIVO`
  - [x] `filterByRole` — filter by role ID
  - [x] `assignRoles` — clear and reassign roles
  - [x] `exportToExcel` — Apache POI `XSSFWorkbook` generation
- [x] Add Apache POI dependency to `pom.xml` (if not present)
- [x] Create `EmployeeController` with all endpoints:
  - [x] `GET /api/employees` — paginated list
  - [x] `GET /api/employees/{id}` — get by ID
  - [x] `POST /api/employees` — create
  - [x] `PUT /api/employees/{id}` — update
  - [x] `DELETE /api/employees/{id}` — delete
  - [x] `GET /api/employees/search?dni=...` — search by DNI
  - [x] `GET /api/employees/filter/status?status=...` — filter by status
  - [x] `GET /api/employees/filter/role?roleId=...` — filter by role
  - [x] `PUT /api/employees/{id}/roles` — assign roles
  - [x] `GET /api/employees/export/excel` — export to Excel
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [x] Create types file (`src/features/employees/types.ts`) with `EmployeeStatus`, `RoleResponse`, `EmployeeResponse`, `EmployeeRequest`
- [x] Create API layer (`src/api/employees.ts`) with all API calls
- [x] Create `useEmployees` hook (paginated list, loading, error, refetch)
- [x] Create `useEmployee` hook (single employee by ID)
- [x] Create `EmployeesPage` (`src/pages/EmployeesPage.tsx`) with toolbar, filters, and DataGrid
- [x] Create `EmployeeList` component with MUI `DataGrid`:
  - [x] Columns: Documento, Nombre Completo, Telefono, Correo Electronico, Estado (Chip), Accion
  - [x] Server-side pagination (`pageSize=12`)
  - [x] Action buttons: view, edit, delete
- [x] Create `EmployeeForm` component (MUI `Dialog`):
  - [x] All form fields with proper labels (Spanish)
  - [x] `DatePicker` for `entryDate`
  - [x] Role multi-select from backend
  - [x] Status select (`Activo`/`Inactivo`)
  - [x] Client-side validation (required fields, email format)
  - [x] Create and edit modes
- [ ] Create `EmployeeFilters` component:
  - [ ] DNI search input (debounced) — **PARTIAL: implemented but missing debounce**
  - [x] Role dropdown filter
  - [x] Status dropdown filter
- [x] Register route `/empleados` with lazy loading
- [x] Export to Excel button (blob download)
- [ ] Verify frontend compiles: `npm run build` (or equivalent)
- [ ] Verify frontend runs: `npm run dev` (or equivalent)

### 8.3 Business Rules Verification

- [x] DNI uniqueness enforced on create (409 if duplicate)
- [x] DNI uniqueness enforced on update (excluding self)
- [x] Email format validated (backend `@Email` + frontend)
- [x] Status only accepts `ACTIVO` / `INACTIVO`
- [x] At least one role required (`@NotEmpty` on `roleIds`)
- [x] Invalid role IDs return 404
- [x] Pagination defaults to 12 rows
- [x] Excel export includes all employees with columns: DNI, Nombre Completo, Telefono, Email, Estado, Roles

### 8.4 Testing

- [ ] `EmployeeServiceImplTest` — unit tests with Mockito for all service methods
- [ ] `EmployeeControllerTest` — `@WebMvcTest` for all endpoints
- [ ] `EmployeeMapperTest` — mapper correctness tests
- [ ] `EmployeeRepositoryTest` — `@DataJpaTest` for custom queries
- [ ] `EmployeeIntegrationTest` — full CRUD flow via HTTP
- [ ] `EmployeeList.test.tsx` — DataGrid renders, pagination, actions
- [ ] `EmployeeForm.test.tsx` — form fields, validation, submit
- [ ] `EmployeeFilters.test.tsx` — filter inputs and callbacks
- [ ] `useEmployees.test.ts` — hook lifecycle and state management
