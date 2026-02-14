# 02 — Gestión de Clientes

## 1. Overview

This spec defines the **Client Management** feature for Autotech. It covers the full-stack implementation: database schema, backend REST API, and frontend UI.

Clients are a foundational entity — they are referenced by vehicles, repair orders, estimates, invoices, and appointments. The system supports three client types:

| Type | Description | Required fields |
|------|-------------|-----------------|
| `PERSONAL` | Individual person, full registration | All fields |
| `EMPRESA` | Business/company, full registration | All fields |
| `TEMPORAL` | Walk-in / one-time client | `firstName`, `lastName`, `phone` only |

`TEMPORAL` clients can be **upgraded** to `PERSONAL` or `EMPRESA` by completing the missing fields. A "factura anónima" (product-only invoice) automatically creates a `TEMPORAL` client.

---

## 2. Git

- **Branch**: `feature/gestion-clientes`
- **Base**: `main`
- **Commit style**: Conventional commits

| Scope | Example |
|-------|---------|
| Entity + enum | `feat: add Client entity and ClientType enum` |
| Repository | `feat: add ClientRepository with search and pagination` |
| DTOs + Mapper | `feat: add client DTOs and MapStruct mapper` |
| Service | `feat: add ClientService with CRUD, search, upgrade, and export` |
| Controller | `feat: add ClientController REST endpoints` |
| Frontend types + API | `feat: add client types and API layer` |
| Frontend pages + components | `feat: add ClientsPage with list, form, filters, and detail dialog` |
| Tests | `test: add unit and integration tests for client module` |

---

## 3. DB Tables

The `clients` table is already defined in `V1__init_schema.sql`. **No new migration needed.**

```sql
CREATE TABLE clients (
    id              BIGSERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    dni             VARCHAR(20),
    commercial_name VARCHAR(150),
    email           VARCHAR(255),
    phone           VARCHAR(20) NOT NULL,
    address         VARCHAR(255),
    province        VARCHAR(100),
    country         VARCHAR(100),
    client_type     VARCHAR(20) NOT NULL
                    CHECK (client_type IN ('PERSONAL', 'EMPRESA', 'TEMPORAL')),
    entry_date      DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_clients_dni ON clients (dni) WHERE dni IS NOT NULL;
```

### Key design decisions

- **DNI** is nullable (TEMPORAL clients don't need it) but has a **partial unique index** — uniqueness is enforced only when DNI IS NOT NULL.
- **phone** is NOT NULL for all types.
- **client_type** is stored as a string checked against three values.
- **Vehicles** are related via the `vehicles` table (`vehicles.client_id → clients.id`), not embedded in the client row.

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.client/
├── controller/
│   └── ClientController.java
├── service/
│   ├── ClientService.java              (interface)
│   └── ClientServiceImpl.java          (implementation)
├── repository/
│   └── ClientRepository.java
├── model/
│   ├── Client.java                     (entity)
│   └── ClientType.java                 (enum)
└── dto/
    ├── ClientRequest.java              (record — create/update)
    ├── ClientResponse.java             (record — output)
    ├── ClientUpgradeRequest.java       (record — upgrade TEMPORAL → full)
    └── ClientMapper.java               (MapStruct interface)
```

---

### 4.2 Entity: `Client`

```java
package com.autotech.client.model;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Client extends BaseEntity {

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "dni", length = 20)
    private String dni;

    @Column(name = "commercial_name", length = 150)
    private String commercialName;

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

    @Column(name = "client_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ClientType clientType;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @OneToMany(mappedBy = "client", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Vehicle> vehicles = new ArrayList<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Client other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

### 4.3 Enum: `ClientType`

```java
package com.autotech.client.model;

public enum ClientType {
    PERSONAL,
    EMPRESA,
    TEMPORAL
}
```

---

### 4.4 Repository: `ClientRepository`

```java
package com.autotech.client.repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByDni(String dni);

    Page<Client> findByClientType(ClientType clientType, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE LOWER(c.dni) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Client> findByDniContaining(@Param("query") String query, Pageable pageable);

    @Query("""
        SELECT c FROM Client c
        WHERE LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(c.dni) LIKE LOWER(CONCAT('%', :query, '%'))
    """)
    Page<Client> search(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = {"vehicles"})
    Optional<Client> findWithVehiclesById(Long id);
}
```

---

### 4.5 DTOs

#### `ClientRequest` (create/update)

```java
package com.autotech.client.dto;

public record ClientRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
        String firstName,

        @NotBlank(message = "El apellido es obligatorio")
        @Size(max = 100, message = "El apellido no puede exceder 100 caracteres")
        String lastName,

        @Size(max = 20, message = "El DNI no puede exceder 20 caracteres")
        String dni,

        @Size(max = 150, message = "El nombre comercial no puede exceder 150 caracteres")
        String commercialName,

        @Email(message = "El correo electrónico no tiene un formato válido")
        @Size(max = 255, message = "El correo no puede exceder 255 caracteres")
        String email,

        @NotBlank(message = "El teléfono es obligatorio")
        @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
        String phone,

        @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
        String address,

        @Size(max = 100, message = "La provincia no puede exceder 100 caracteres")
        String province,

        @Size(max = 100, message = "El país no puede exceder 100 caracteres")
        String country,

        @NotNull(message = "El tipo de cliente es obligatorio")
        ClientType clientType,

        LocalDate entryDate
) {}
```

> **Note on conditional validation**: Jakarta `@NotBlank` on `dni` is NOT applied at the DTO annotation level because DNI is only required for `PERSONAL`/`EMPRESA`. This conditional validation is enforced in the **service layer** (see §4.7 Business Logic). The annotation level only enforces universal constraints (format, max length). The service checks:
> - If `clientType == PERSONAL || clientType == EMPRESA` → `dni`, `address`, `province`, `country` must be non-blank.
> - If `clientType == TEMPORAL` → only `firstName`, `lastName`, `phone` are required (already annotated as `@NotBlank`).

#### `ClientResponse`

```java
package com.autotech.client.dto;

public record ClientResponse(
        Long id,
        String firstName,
        String lastName,
        String dni,
        String commercialName,
        String email,
        String phone,
        String address,
        String province,
        String country,
        ClientType clientType,
        LocalDate entryDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

#### `ClientUpgradeRequest` (upgrade TEMPORAL → PERSONAL/EMPRESA)

```java
package com.autotech.client.dto;

public record ClientUpgradeRequest(
        @NotBlank(message = "El DNI es obligatorio para clientes registrados")
        @Size(max = 20, message = "El DNI no puede exceder 20 caracteres")
        String dni,

        @Size(max = 150, message = "El nombre comercial no puede exceder 150 caracteres")
        String commercialName,

        @Email(message = "El correo electrónico no tiene un formato válido")
        @Size(max = 255, message = "El correo no puede exceder 255 caracteres")
        String email,

        @NotBlank(message = "La dirección es obligatoria para clientes registrados")
        @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
        String address,

        @NotBlank(message = "La provincia es obligatoria para clientes registrados")
        @Size(max = 100, message = "La provincia no puede exceder 100 caracteres")
        String province,

        @NotBlank(message = "El país es obligatorio para clientes registrados")
        @Size(max = 100, message = "El país no puede exceder 100 caracteres")
        String country,

        @NotNull(message = "El tipo de cliente es obligatorio")
        ClientType clientType,

        LocalDate entryDate
) {}
```

> `clientType` in `ClientUpgradeRequest` must be `PERSONAL` or `EMPRESA`. The service rejects `TEMPORAL`.

---

### 4.6 Mapper: `ClientMapper`

```java
package com.autotech.client.dto;

@Mapper(componentModel = "spring")
public interface ClientMapper {

    ClientResponse toResponse(Client entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "vehicles", ignore = true)
    Client toEntity(ClientRequest request);

    List<ClientResponse> toResponseList(List<Client> entities);
}
```

---

### 4.7 Service: `ClientService`

#### Interface

```java
package com.autotech.client.service;

public interface ClientService {

    Page<ClientResponse> getAll(Pageable pageable);

    ClientResponse getById(Long id);

    ClientResponse create(ClientRequest request);

    ClientResponse update(Long id, ClientRequest request);

    void delete(Long id);

    Page<ClientResponse> search(String query, Pageable pageable);

    Page<ClientResponse> findByClientType(ClientType clientType, Pageable pageable);

    ClientResponse upgradeToRegistered(Long id, ClientUpgradeRequest request);

    byte[] exportToExcel();
}
```

#### Implementation: `ClientServiceImpl`

```java
package com.autotech.client.service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final ClientMapper clientMapper;

    // --- CRUD ---

    @Override
    @Transactional(readOnly = true)
    public Page<ClientResponse> getAll(Pageable pageable) { ... }

    @Override
    @Transactional(readOnly = true)
    public ClientResponse getById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
        return clientMapper.toResponse(client);
    }

    @Override
    @Transactional
    public ClientResponse create(ClientRequest request) {
        validateClientType(request);          // conditional field validation
        validateDniUniqueness(request.dni());  // partial unique index check
        Client client = clientMapper.toEntity(request);
        Client saved = clientRepository.save(client);
        log.info("Created client with id {}", saved.getId());
        return clientMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ClientResponse update(Long id, ClientRequest request) {
        Client existing = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
        validateClientType(request);
        validateDniUniquenessForUpdate(request.dni(), id);
        // Map fields from request to existing entity
        existing.setFirstName(request.firstName());
        existing.setLastName(request.lastName());
        existing.setDni(request.dni());
        existing.setCommercialName(request.commercialName());
        existing.setEmail(request.email());
        existing.setPhone(request.phone());
        existing.setAddress(request.address());
        existing.setProvince(request.province());
        existing.setCountry(request.country());
        existing.setClientType(request.clientType());
        existing.setEntryDate(request.entryDate());
        Client saved = clientRepository.save(existing);
        log.info("Updated client with id {}", saved.getId());
        return clientMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client", id);
        }
        clientRepository.deleteById(id);
        log.info("Deleted client with id {}", id);
    }

    // --- Search & Filter ---

    @Override
    @Transactional(readOnly = true)
    public Page<ClientResponse> search(String query, Pageable pageable) {
        return clientRepository.search(query, pageable).map(clientMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClientResponse> findByClientType(ClientType clientType, Pageable pageable) {
        return clientRepository.findByClientType(clientType, pageable).map(clientMapper::toResponse);
    }

    // --- Upgrade ---

    @Override
    @Transactional
    public ClientResponse upgradeToRegistered(Long id, ClientUpgradeRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));

        if (client.getClientType() != ClientType.TEMPORAL) {
            throw new IllegalStateException("Solo los clientes TEMPORAL pueden ser actualizados");
        }
        if (request.clientType() == ClientType.TEMPORAL) {
            throw new IllegalArgumentException("El tipo de cliente destino no puede ser TEMPORAL");
        }

        validateDniUniqueness(request.dni());

        client.setDni(request.dni());
        client.setCommercialName(request.commercialName());
        client.setEmail(request.email());
        client.setAddress(request.address());
        client.setProvince(request.province());
        client.setCountry(request.country());
        client.setClientType(request.clientType());
        client.setEntryDate(request.entryDate());

        Client saved = clientRepository.save(client);
        log.info("Upgraded client {} from TEMPORAL to {}", id, request.clientType());
        return clientMapper.toResponse(saved);
    }

    // --- Export ---

    @Override
    @Transactional(readOnly = true)
    public byte[] exportToExcel() {
        // Uses Apache POI to generate an .xlsx file with all client data
        // Columns: DNI, Nombre Completo, Teléfono, Correo, Tipo, Dirección, Provincia, País, Fecha Ingreso
        // Returns byte[] for the controller to stream as a download
        ...
    }

    // --- Private helpers ---

    private void validateClientType(ClientRequest request) {
        if (request.clientType() == ClientType.PERSONAL || request.clientType() == ClientType.EMPRESA) {
            if (request.dni() == null || request.dni().isBlank()) {
                throw new IllegalArgumentException("El DNI es obligatorio para clientes PERSONAL y EMPRESA");
            }
            if (request.address() == null || request.address().isBlank()) {
                throw new IllegalArgumentException("La dirección es obligatoria para clientes PERSONAL y EMPRESA");
            }
            if (request.province() == null || request.province().isBlank()) {
                throw new IllegalArgumentException("La provincia es obligatoria para clientes PERSONAL y EMPRESA");
            }
            if (request.country() == null || request.country().isBlank()) {
                throw new IllegalArgumentException("El país es obligatorio para clientes PERSONAL y EMPRESA");
            }
        }
    }

    private void validateDniUniqueness(String dni) {
        if (dni != null && !dni.isBlank() && clientRepository.existsByDni(dni)) {
            throw new IllegalArgumentException("Ya existe un cliente con el DNI: " + dni);
        }
    }

    private void validateDniUniquenessForUpdate(String dni, Long clientId) {
        if (dni != null && !dni.isBlank()) {
            clientRepository.findByDniContaining(dni, Pageable.unpaged())
                    .stream()
                    .filter(c -> !c.getId().equals(clientId))
                    .findAny()
                    .ifPresent(c -> {
                        throw new IllegalArgumentException("Ya existe un cliente con el DNI: " + dni);
                    });
        }
    }
}
```

> **Note on `exportToExcel()`**: Add `org.apache.poi:poi-ooxml` as a Maven dependency. The service creates a `Workbook`, writes all clients, and returns `byte[]`.

---

### 4.8 Controller: `ClientController`

Base path: `/api/clients`

```java
package com.autotech.client.controller;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ClientResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSortOrders(sort)));
        return ResponseEntity.ok(ApiResponse.success(clientService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(clientService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClientResponse>> create(
            @Valid @RequestBody ClientRequest request) {
        ClientResponse created = clientService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cliente creado exitosamente", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ClientRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cliente actualizado exitosamente", clientService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Cliente eliminado exitosamente", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ClientResponse>>> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(clientService.search(query, pageable)));
    }

    @GetMapping("/by-type")
    public ResponseEntity<ApiResponse<Page<ClientResponse>>> findByType(
            @RequestParam ClientType clientType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(clientService.findByClientType(clientType, pageable)));
    }

    @PatchMapping("/{id}/upgrade")
    public ResponseEntity<ApiResponse<ClientResponse>> upgrade(
            @PathVariable Long id,
            @Valid @RequestBody ClientUpgradeRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cliente actualizado exitosamente", clientService.upgradeToRegistered(id, request)));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportToExcel() {
        byte[] excelBytes = clientService.exportToExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=clientes.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }
}
```

### Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/clients?page=0&size=12&sort=createdAt,desc` | List all clients (paginated) |
| `GET` | `/api/clients/{id}` | Get client by ID |
| `POST` | `/api/clients` | Create a new client |
| `PUT` | `/api/clients/{id}` | Update a client |
| `DELETE` | `/api/clients/{id}` | Delete a client |
| `GET` | `/api/clients/search?query=...&page=0&size=12` | Search by DNI or name |
| `GET` | `/api/clients/by-type?clientType=PERSONAL&page=0&size=12` | Filter by client type |
| `PATCH` | `/api/clients/{id}/upgrade` | Upgrade TEMPORAL to PERSONAL/EMPRESA |
| `GET` | `/api/clients/export` | Export all clients to Excel (.xlsx) |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── features/
│   └── clients/
│       ├── components/
│       │   ├── ClientList.tsx
│       │   ├── ClientForm.tsx
│       │   ├── ClientFilters.tsx
│       │   └── ClientDetailDialog.tsx
│       ├── hooks/
│       │   ├── useClients.ts
│       │   └── useClient.ts
│       └── types/
│           └── client.ts
├── api/
│   └── clients.ts
├── pages/
│   └── ClientsPage.tsx
└── routes/
    └── (add route to existing router config)
```

---

### 5.2 Types: `src/features/clients/types/client.ts`

```typescript
export type ClientType = "PERSONAL" | "EMPRESA" | "TEMPORAL";

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  dni: string | null;
  commercialName: string | null;
  email: string | null;
  phone: string;
  address: string | null;
  province: string | null;
  country: string | null;
  clientType: ClientType;
  entryDate: string | null;      // ISO date string "YYYY-MM-DD"
  createdAt: string;              // ISO datetime
  updatedAt: string;              // ISO datetime
}

export interface ClientRequest {
  firstName: string;
  lastName: string;
  dni?: string;
  commercialName?: string;
  email?: string;
  phone: string;
  address?: string;
  province?: string;
  country?: string;
  clientType: ClientType;
  entryDate?: string;
}

export interface ClientUpgradeRequest {
  dni: string;
  commercialName?: string;
  email?: string;
  address: string;
  province: string;
  country: string;
  clientType: "PERSONAL" | "EMPRESA";
  entryDate?: string;
}

export type ClientResponse = Client;
```

---

### 5.3 API: `src/api/clients.ts`

```typescript
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Client, ClientRequest, ClientUpgradeRequest } from "@/features/clients/types/client";

export const clientsApi = {
  getAll: (page = 0, size = 12, sort = "createdAt,desc") =>
    apiClient.get<ApiResponse<PageResponse<Client>>>("/clients", {
      params: { page, size, sort },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Client>>(`/clients/${id}`),

  create: (data: ClientRequest) =>
    apiClient.post<ApiResponse<Client>>("/clients", data),

  update: (id: number, data: ClientRequest) =>
    apiClient.put<ApiResponse<Client>>(`/clients/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/clients/${id}`),

  search: (query: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<Client>>>("/clients/search", {
      params: { query, page, size },
    }),

  findByType: (clientType: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<Client>>>("/clients/by-type", {
      params: { clientType, page, size },
    }),

  upgrade: (id: number, data: ClientUpgradeRequest) =>
    apiClient.patch<ApiResponse<Client>>(`/clients/${id}/upgrade`, data),

  exportToExcel: () =>
    apiClient.get<Blob>("/clients/export", { responseType: "blob" }),
};
```

---

### 5.4 Hooks

#### `useClients.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { clientsApi } from "@/api/clients";
import type { Client } from "@/features/clients/types/client";

export function useClients(initialPage = 0, initialSize = 12) {
  const [clients, setClients] = useState<Client[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientsApi.getAll(page, size);
      setClients(res.data.data.content);
      setTotalElements(res.data.data.totalElements);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  return { clients, totalElements, page, size, setPage, setSize, loading, error, refetch: fetchClients };
}
```

#### `useClient.ts`

```typescript
import { useState, useEffect } from "react";
import { clientsApi } from "@/api/clients";
import type { Client } from "@/features/clients/types/client";

export function useClient(id: number | null) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) return;
    setLoading(true);
    setError(null);
    clientsApi.getById(id)
      .then((res) => setClient(res.data.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar el cliente"))
      .finally(() => setLoading(false));
  }, [id]);

  return { client, loading, error };
}
```

---

### 5.5 Pages

#### `ClientsPage.tsx` — Route: `/clientes`

```typescript
// src/pages/ClientsPage.tsx
// default export (page-level component)
// Composes: ClientFilters + ClientList + ClientForm + ClientDetailDialog
// Layout: Box with page title "Gestión de Clientes" (Typography h4)
//   - Top bar: search field, "Registrar Cliente" button, "Exportar a Excel" button
//   - ClientFilters component
//   - ClientList DataGrid
//   - ClientForm Dialog (for create/edit)
//   - ClientDetailDialog (for view-all-data)
```

**Route registration**: Add to the router config:

```typescript
{
  path: "/clientes",
  element: <React.lazy(() => import("@/pages/ClientsPage")) />,
}
```

---

### 5.6 Components

#### `ClientList.tsx`

- Uses MUI **DataGrid** (from `@mui/x-data-grid`).
- **Page size**: 12 rows per page (matches backend default).
- **Server-side pagination**: `paginationMode="server"`, `rowCount={totalElements}`.
- **Columns**:

| Column Header (Spanish) | Field | Width | Notes |
|--------------------------|-------|-------|-------|
| Documento | `dni` | 150 | Show "—" if null |
| Nombre Completo | computed: `${firstName} ${lastName}` | 200 | |
| Teléfono | `phone` | 150 | |
| Correo Electrónico | `email` | 200 | Show "—" if null |
| Tipo Cliente | `clientType` | 150 | Display as Chip: PERSONAL (blue), EMPRESA (green), TEMPORAL (orange) |
| Acción | actions | 150 | IconButtons: Edit (EditIcon), Delete (DeleteIcon), View (VisibilityIcon) |

- **Multi-select delete**: Checkboxes on rows + a "Eliminar seleccionados" button that appears when >= 1 row is selected. Show a confirmation dialog before deleting.

#### `ClientForm.tsx`

- MUI **Dialog** component.
- Used for both **create** and **edit** (receives optional `client` prop for edit mode).
- **`clientType` selector** (Select / RadioGroup) at the top — drives field visibility:
  - `TEMPORAL` → shows only: `firstName`, `lastName`, `phone` (all required)
  - `PERSONAL` / `EMPRESA` → shows all fields; `dni`, `address`, `province`, `country` become required
- **Fields** (all MUI `TextField` unless noted):

| Field Label (Spanish) | Field name | Type | Required (PERSONAL/EMPRESA) | Required (TEMPORAL) | Validation |
|------------------------|-----------|------|---------------------------|---------------------|------------|
| Tipo de Cliente | `clientType` | Select | ✅ | ✅ | — |
| Nombre | `firstName` | text | ✅ | ✅ | max 100 chars |
| Apellido | `lastName` | text | ✅ | ✅ | max 100 chars |
| DNI / Documento | `dni` | text | ✅ | ❌ (hidden) | max 20, unique (async check) |
| Nombre Comercial | `commercialName` | text | ❌ | ❌ (hidden) | max 150 chars |
| Correo Electrónico | `email` | email | ❌ | ❌ (hidden) | email format |
| Teléfono | `phone` | tel | ✅ | ✅ | max 20 chars |
| Dirección | `address` | text | ✅ | ❌ (hidden) | max 255 chars |
| Provincia | `province` | text | ✅ | ❌ (hidden) | max 100 chars |
| País | `country` | text | ✅ | ❌ (hidden) | max 100 chars |
| Fecha de Entrada | `entryDate` | date (DatePicker) | ❌ | ❌ (hidden) | valid date |

- **Buttons**: "Cancelar" (secondary), "Guardar" (primary).
- On submit: call `clientsApi.create()` or `clientsApi.update()`, show success Snackbar, close dialog, trigger list refetch.
- On error: show error Alert inside dialog.

#### `ClientFilters.tsx`

- Search `TextField` with search icon — filters by DNI or name (debounced, 300ms).
- Calls `clientsApi.search(query, page, size)` on input change.
- Placed above the DataGrid.

#### `ClientDetailDialog.tsx`

- MUI **Dialog** component (read-only).
- Triggered by the "view" (eye icon) action button in the DataGrid.
- Displays **all** client fields in a structured layout using `Grid`, `Typography`, and `Divider`.
- Shows associated vehicles if available (fetched via `findWithVehiclesById` on the backend).
- Close button.

---

## 6. Business Rules

### 6.1 Type-Driven Validation

| Rule | Applies to |
|------|-----------|
| `firstName`, `lastName`, `phone` are always required | ALL types |
| `dni`, `address`, `province`, `country` are required | PERSONAL, EMPRESA only |
| `commercialName`, `email`, `entryDate` are always optional | ALL types |
| Form hides non-required fields for TEMPORAL | Frontend only |
| Service-layer validation enforces conditional requirements | Backend |

### 6.2 DNI Uniqueness

- The database enforces uniqueness via a **partial unique index**: `CREATE UNIQUE INDEX uq_clients_dni ON clients (dni) WHERE dni IS NOT NULL;`
- The backend service additionally checks `existsByDni(dni)` before creating/updating to provide a clean user-facing error message (instead of a raw DB constraint violation).
- On update, the check excludes the current client's own DNI.
- DNI is `null` for TEMPORAL clients and is not checked for uniqueness in that case.

### 6.3 Upgrade Flow (TEMPORAL → PERSONAL/EMPRESA)

1. Only clients with `clientType == TEMPORAL` can be upgraded.
2. The `PATCH /api/clients/{id}/upgrade` endpoint accepts a `ClientUpgradeRequest`.
3. The target `clientType` in the request must be `PERSONAL` or `EMPRESA` (not `TEMPORAL`).
4. All required fields for the target type must be provided (DNI, address, province, country).
5. DNI uniqueness is validated during upgrade.
6. After upgrade, the client is fully registered and can no longer be considered TEMPORAL.

### 6.4 TEMPORAL Client Restrictions

- TEMPORAL clients **cannot** have estimates or repair orders created for them directly (these require a vehicle, and vehicles require registered clients). However, they **can** have product-only invoices ("factura anónima").
- If a TEMPORAL client returns and needs a full service, they must first be upgraded to PERSONAL/EMPRESA.

### 6.5 Deletion Rules

- Clients with associated vehicles, repair orders, estimates, or invoices **cannot** be deleted. The service must check for dependent records and throw an appropriate error.
- The frontend supports multi-select deletion: the user selects rows and clicks "Eliminar seleccionados". A confirmation dialog is shown before executing.
- Each selected client is validated individually for deletion eligibility. If any cannot be deleted, the error message identifies which clients are blocked and why.

### 6.6 Export to Excel

- Exports ALL clients (not just the current page) to an `.xlsx` file.
- Columns: Documento, Nombre Completo, Nombre Comercial, Teléfono, Correo Electrónico, Dirección, Provincia, País, Tipo de Cliente, Fecha de Entrada.
- File is downloaded as `clientes.xlsx`.

---

## 7. Testing

### 7.1 Backend Unit Tests

**Class**: `ClientServiceImplTest`

| Test Method | Description |
|-------------|-------------|
| `givenValidPageable_whenGetAll_thenReturnPageOfClients` | Returns paginated client list |
| `givenValidId_whenGetById_thenReturnClientResponse` | Returns client by ID |
| `givenNonExistentId_whenGetById_thenThrowResourceNotFoundException` | Throws when client not found |
| `givenValidPersonalRequest_whenCreate_thenReturnCreatedClient` | Creates PERSONAL client with all fields |
| `givenValidTemporalRequest_whenCreate_thenReturnCreatedClient` | Creates TEMPORAL client with minimal fields |
| `givenPersonalRequestMissingDni_whenCreate_thenThrowIllegalArgumentException` | Rejects PERSONAL without DNI |
| `givenEmpresaRequestMissingAddress_whenCreate_thenThrowIllegalArgumentException` | Rejects EMPRESA without address |
| `givenDuplicateDni_whenCreate_thenThrowIllegalArgumentException` | Rejects duplicate DNI |
| `givenValidRequest_whenUpdate_thenReturnUpdatedClient` | Updates client successfully |
| `givenDuplicateDniOnOtherClient_whenUpdate_thenThrowIllegalArgumentException` | Rejects DNI collision on update |
| `givenExistingId_whenDelete_thenDeleteSuccessfully` | Deletes client |
| `givenNonExistentId_whenDelete_thenThrowResourceNotFoundException` | Throws when deleting non-existent client |
| `givenSearchQuery_whenSearch_thenReturnMatchingClients` | Returns clients matching DNI or name |
| `givenTemporalClient_whenUpgrade_thenReturnUpgradedClient` | Upgrades TEMPORAL to PERSONAL |
| `givenNonTemporalClient_whenUpgrade_thenThrowIllegalStateException` | Rejects upgrade of already-registered client |
| `givenTemporalTarget_whenUpgrade_thenThrowIllegalArgumentException` | Rejects upgrade to TEMPORAL |
| `givenDuplicateDni_whenUpgrade_thenThrowIllegalArgumentException` | Rejects upgrade with existing DNI |
| `givenClients_whenExportToExcel_thenReturnByteArray` | Generates Excel file |

### 7.2 Backend Integration Tests

**Class**: `ClientControllerIT`

| Test Method | Description |
|-------------|-------------|
| `givenValidRequest_whenCreateClient_thenReturn201` | POST `/api/clients` returns 201 |
| `givenInvalidRequest_whenCreateClient_thenReturn400` | POST with missing fields returns 400 |
| `givenExistingClient_whenGetById_thenReturn200` | GET `/api/clients/{id}` returns client |
| `givenNonExistentId_whenGetById_thenReturn404` | GET with bad ID returns 404 |
| `givenExistingClient_whenUpdate_thenReturn200` | PUT `/api/clients/{id}` updates |
| `givenExistingClient_whenDelete_thenReturn200` | DELETE `/api/clients/{id}` deletes |
| `givenSearchQuery_whenSearch_thenReturnFilteredResults` | GET `/api/clients/search` returns matches |
| `givenTemporalClient_whenUpgrade_thenReturn200` | PATCH `/api/clients/{id}/upgrade` upgrades |
| `givenClients_whenExport_thenReturnExcelFile` | GET `/api/clients/export` returns .xlsx |

### 7.3 Frontend Tests

**File**: `ClientList.test.tsx`

| Test | Description |
|------|-------------|
| renders loading state | Shows skeleton/spinner initially |
| renders client data in DataGrid | Displays rows with correct columns |
| handles empty state | Shows "No hay clientes registrados" message |
| handles error state | Shows error Alert |
| pagination works | Changes page, fetches new data |
| delete button shows confirmation | Dialog appears before deletion |

**File**: `ClientForm.test.tsx`

| Test | Description |
|------|-------------|
| renders create form | Empty form with all fields |
| renders edit form with pre-filled data | Fields populated from client prop |
| hides fields for TEMPORAL type | Only shows firstName, lastName, phone |
| shows all fields for PERSONAL type | All fields visible and required indicators shown |
| validates required fields | Shows error messages on empty submit |
| validates email format | Shows error for invalid email |
| submits create request | Calls API create endpoint |
| submits update request | Calls API update endpoint |

**File**: `ClientFilters.test.tsx`

| Test | Description |
|------|-------------|
| renders search input | Search field visible |
| debounces search input | Waits 300ms before calling API |
| triggers search on input | Calls search API with query |
