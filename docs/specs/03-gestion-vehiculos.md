# 03 – Gestión de Vehículos

## 1. Overview

This module implements full CRUD management for vehicles in the Autotech workshop system. A vehicle always belongs to a client and may have a brand and a vehicle type. The UI allows listing, searching by plate, filtering (by brand, year, model), creating, editing, deleting, and viewing vehicle details. Brands can be created inline during vehicle registration, and if the owning client does not exist, the user is redirected to client registration.

**Route:** `/vehiculos`

---

## 2. Git

| Item | Value |
|------|-------|
| Branch | `feature/gestion-vehiculos` |
| Base | `main` |
| Commit style | `feat: ...`, `fix: ...`, `test: ...` (conventional commits) |

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. **No new migration is needed** for this feature.

### 3.1 `vehicle_types`

```sql
CREATE TABLE vehicle_types (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,   -- e.g. AUTO, CAMIONETA, UTILITARIO
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Seeded values: `AUTO`, `CAMIONETA`, `UTILITARIO`.

### 3.2 `brands`

```sql
CREATE TABLE brands (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3.3 `vehicles`

```sql
CREATE TABLE vehicles (
    id              BIGSERIAL PRIMARY KEY,
    client_id       BIGINT NOT NULL REFERENCES clients(id),
    plate           VARCHAR(20) NOT NULL UNIQUE,
    chassis_number  VARCHAR(50),
    engine_number   VARCHAR(50),
    brand_id        BIGINT REFERENCES brands(id),
    model           VARCHAR(100),
    year            INTEGER,
    vehicle_type_id BIGINT REFERENCES vehicle_types(id),
    observations    TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vehicles_client_id ON vehicles (client_id);
```

---

## 4. Backend

### 4.1 Entities

All entities extend `BaseEntity` (provides `id`, `createdAt`, `updatedAt`). All use `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@AllArgsConstructor`. Manual `equals`/`hashCode` by `id`.

#### `Vehicle` – `com.autotech.vehicle.model.Vehicle`

```java
@Entity
@Table(name = "vehicles")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Vehicle extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "plate", nullable = false, length = 20, unique = true)
    private String plate;

    @Column(name = "chassis_number", length = 50)
    private String chassisNumber;

    @Column(name = "engine_number", length = 50)
    private String engineNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "year")
    private Integer year;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_type_id")
    private VehicleType vehicleType;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    // equals & hashCode by id (see entity-rules.md)
}
```

#### `Brand` – `com.autotech.vehicle.model.Brand`

```java
@Entity
@Table(name = "brands")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Brand extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100, unique = true)
    private String name;

    // equals & hashCode by id
}
```

#### `VehicleType` – `com.autotech.vehicle.model.VehicleType`

```java
@Entity
@Table(name = "vehicle_types")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class VehicleType extends BaseEntity {

    @Column(name = "name", nullable = false, length = 50, unique = true)
    private String name;

    // equals & hashCode by id
}
```

### 4.2 Repositories

All annotated with `@Repository`, extend `JpaRepository<Entity, Long>`.

#### `VehicleRepository` – `com.autotech.vehicle.repository.VehicleRepository`

```java
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Optional<Vehicle> findById(Long id);

    List<Vehicle> findByClientId(Long clientId);

    boolean existsByPlate(String plate);

    boolean existsByPlateAndIdNot(String plate, Long id);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findByPlateContainingIgnoreCase(String plate, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findByBrandId(Long brandId, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findByYear(Integer year, Pageable pageable);

    @EntityGraph(attributePaths = {"client", "brand", "vehicleType"})
    Page<Vehicle> findByModel(String model, Pageable pageable);
}
```

#### `BrandRepository` – `com.autotech.vehicle.repository.BrandRepository`

```java
@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {

    Optional<Brand> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
```

#### `VehicleTypeRepository` – `com.autotech.vehicle.repository.VehicleTypeRepository`

```java
@Repository
public interface VehicleTypeRepository extends JpaRepository<VehicleType, Long> {
    // No custom queries — only getAll() is needed
}
```

### 4.3 DTOs

All DTOs are Java `record` types. Request DTOs have Jakarta Validation annotations. Response DTOs have none.

#### `VehicleRequest` – `com.autotech.vehicle.dto.VehicleRequest`

```java
public record VehicleRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long clientId,

        @NotBlank(message = "La patente es obligatoria")
        @Size(max = 20, message = "La patente no puede superar los 20 caracteres")
        String plate,

        @Size(max = 50, message = "El número de chasis no puede superar los 50 caracteres")
        String chassisNumber,

        @Size(max = 50, message = "El número de motor no puede superar los 50 caracteres")
        String engineNumber,

        Long brandId,

        @Size(max = 100, message = "El modelo no puede superar los 100 caracteres")
        String model,

        Integer year,

        Long vehicleTypeId,

        String observations
) {}
```

#### `VehicleResponse` – `com.autotech.vehicle.dto.VehicleResponse`

```java
public record VehicleResponse(
        Long id,
        Long clientId,
        String clientFirstName,
        String clientLastName,
        String clientDni,
        String plate,
        String chassisNumber,
        String engineNumber,
        Long brandId,
        String brandName,
        String model,
        Integer year,
        Long vehicleTypeId,
        String vehicleTypeName,
        String observations,
        boolean inRepair,
        LocalDateTime createdAt
) {}
```

> **Note:** `inRepair` is a derived field. It is `true` when there exists at least one `repair_order` for this vehicle with a status other than `ENTREGADO`. This is computed at service level via a query to `RepairOrderRepository` or a direct JPQL count query (see Service section).

#### `BrandRequest` – `com.autotech.vehicle.dto.BrandRequest`

```java
public record BrandRequest(
        @NotBlank(message = "El nombre de la marca es obligatorio")
        @Size(max = 100, message = "El nombre de la marca no puede superar los 100 caracteres")
        String name
) {}
```

#### `BrandResponse` – `com.autotech.vehicle.dto.BrandResponse`

```java
public record BrandResponse(
        Long id,
        String name,
        LocalDateTime createdAt
) {}
```

#### `VehicleTypeResponse` – `com.autotech.vehicle.dto.VehicleTypeResponse`

```java
public record VehicleTypeResponse(
        Long id,
        String name
) {}
```

### 4.4 Mappers

MapStruct interfaces annotated with `@Mapper(componentModel = "spring")`.

#### `VehicleMapper` – `com.autotech.vehicle.dto.VehicleMapper`

```java
@Mapper(componentModel = "spring")
public interface VehicleMapper {

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFirstName", source = "client.firstName")
    @Mapping(target = "clientLastName", source = "client.lastName")
    @Mapping(target = "clientDni", source = "client.dni")
    @Mapping(target = "brandId", source = "brand.id")
    @Mapping(target = "brandName", source = "brand.name")
    @Mapping(target = "vehicleTypeId", source = "vehicleType.id")
    @Mapping(target = "vehicleTypeName", source = "vehicleType.name")
    @Mapping(target = "inRepair", ignore = true)  // set by service
    VehicleResponse toResponse(Vehicle entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "client", ignore = true)      // resolved by service
    @Mapping(target = "brand", ignore = true)        // resolved by service
    @Mapping(target = "vehicleType", ignore = true)  // resolved by service
    Vehicle toEntity(VehicleRequest request);
}
```

#### `BrandMapper` – `com.autotech.vehicle.dto.BrandMapper`

```java
@Mapper(componentModel = "spring")
public interface BrandMapper {

    BrandResponse toResponse(Brand entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Brand toEntity(BrandRequest request);
}
```

### 4.5 Services

#### `VehicleService` (interface) – `com.autotech.vehicle.service.VehicleService`

```java
public interface VehicleService {

    Page<VehicleResponse> getAll(Pageable pageable);

    VehicleResponse getById(Long id);

    VehicleResponse create(VehicleRequest request);

    VehicleResponse update(Long id, VehicleRequest request);

    void delete(Long id);

    Page<VehicleResponse> searchByPlate(String plate, Pageable pageable);

    List<VehicleResponse> getByClientId(Long clientId);

    Page<VehicleResponse> filterByBrand(Long brandId, Pageable pageable);

    Page<VehicleResponse> filterByYear(Integer year, Pageable pageable);

    Page<VehicleResponse> filterByModel(String model, Pageable pageable);
}
```

#### `VehicleServiceImpl` – `com.autotech.vehicle.service.VehicleServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleMapper vehicleMapper;
    private final ClientService clientService;          // cross-module: validates client exists
    private final BrandRepository brandRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    // For "inRepair" computation:
    // Option A: inject RepairOrderRepository (only if in same module)
    // Option B: inject RepairOrderService (preferred, cross-module)
    // Option C: use a @Query on VehicleRepository with a subselect

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> getAll(Pageable pageable) {
        return vehicleRepository.findAll(pageable)
                .map(this::toResponseWithRepairStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponse getById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        return toResponseWithRepairStatus(vehicle);
    }

    @Override
    @Transactional
    public VehicleResponse create(VehicleRequest request) {
        // 1. Validate plate uniqueness
        if (vehicleRepository.existsByPlate(request.plate())) {
            throw new IllegalArgumentException("La patente ya se encuentra registrada");
        }

        // 2. Resolve client (validates existence via ClientService)
        Client client = resolveClient(request.clientId());

        // 3. Resolve brand (optional)
        Brand brand = resolveBrand(request.brandId());

        // 4. Resolve vehicle type (optional)
        VehicleType vehicleType = resolveVehicleType(request.vehicleTypeId());

        // 5. Map and save
        Vehicle vehicle = vehicleMapper.toEntity(request);
        vehicle.setClient(client);
        vehicle.setBrand(brand);
        vehicle.setVehicleType(vehicleType);

        Vehicle saved = vehicleRepository.save(vehicle);
        log.info("Created vehicle with id {} and plate {}", saved.getId(), saved.getPlate());
        return toResponseWithRepairStatus(saved);
    }

    @Override
    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));

        // Validate plate uniqueness (excluding current vehicle)
        if (vehicleRepository.existsByPlateAndIdNot(request.plate(), id)) {
            throw new IllegalArgumentException("La patente ya se encuentra registrada");
        }

        // Resolve relationships
        Client client = resolveClient(request.clientId());
        Brand brand = resolveBrand(request.brandId());
        VehicleType vehicleType = resolveVehicleType(request.vehicleTypeId());

        // Update fields
        existing.setClient(client);
        existing.setPlate(request.plate());
        existing.setChassisNumber(request.chassisNumber());
        existing.setEngineNumber(request.engineNumber());
        existing.setBrand(brand);
        existing.setModel(request.model());
        existing.setYear(request.year());
        existing.setVehicleType(vehicleType);
        existing.setObservations(request.observations());

        Vehicle saved = vehicleRepository.save(existing);
        log.info("Updated vehicle with id {}", saved.getId());
        return toResponseWithRepairStatus(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        vehicleRepository.delete(vehicle);
        log.info("Deleted vehicle with id {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> searchByPlate(String plate, Pageable pageable) {
        return vehicleRepository.findByPlateContainingIgnoreCase(plate, pageable)
                .map(this::toResponseWithRepairStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getByClientId(Long clientId) {
        return vehicleRepository.findByClientId(clientId).stream()
                .map(this::toResponseWithRepairStatus)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> filterByBrand(Long brandId, Pageable pageable) {
        return vehicleRepository.findByBrandId(brandId, pageable)
                .map(this::toResponseWithRepairStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> filterByYear(Integer year, Pageable pageable) {
        return vehicleRepository.findByYear(year, pageable)
                .map(this::toResponseWithRepairStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> filterByModel(String model, Pageable pageable) {
        return vehicleRepository.findByModel(model, pageable)
                .map(this::toResponseWithRepairStatus);
    }

    // --- Private helpers ---

    private VehicleResponse toResponseWithRepairStatus(Vehicle vehicle) {
        VehicleResponse response = vehicleMapper.toResponse(vehicle);
        // Compute inRepair: check if any active repair order exists for this vehicle
        // boolean inRepair = repairOrderService.existsActiveByVehicleId(vehicle.getId());
        // Return a new VehicleResponse with inRepair set
        // (use a with-style copy or construct a new record)
        return response;
    }

    private Client resolveClient(Long clientId) {
        // Use ClientService to validate and retrieve
        // clientService.getById(clientId) throws ResourceNotFoundException if not found
        // Return the Client entity (or fetch from ClientRepository if in same module)
        ...
    }

    private Brand resolveBrand(Long brandId) {
        if (brandId == null) return null;
        return brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", brandId));
    }

    private VehicleType resolveVehicleType(Long vehicleTypeId) {
        if (vehicleTypeId == null) return null;
        return vehicleTypeRepository.findById(vehicleTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleType", vehicleTypeId));
    }
}
```

#### `BrandService` (interface) – `com.autotech.vehicle.service.BrandService`

```java
public interface BrandService {

    List<BrandResponse> getAll();

    BrandResponse getById(Long id);

    BrandResponse create(BrandRequest request);

    BrandResponse update(Long id, BrandRequest request);

    void delete(Long id);
}
```

#### `BrandServiceImpl` – `com.autotech.vehicle.service.BrandServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;

    @Override
    @Transactional(readOnly = true)
    public List<BrandResponse> getAll() {
        return brandRepository.findAll().stream()
                .map(brandMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BrandResponse getById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        return brandMapper.toResponse(brand);
    }

    @Override
    @Transactional
    public BrandResponse create(BrandRequest request) {
        if (brandRepository.existsByNameIgnoreCase(request.name())) {
            throw new IllegalArgumentException("La marca ya se encuentra registrada");
        }
        Brand brand = brandMapper.toEntity(request);
        Brand saved = brandRepository.save(brand);
        log.info("Created brand with id {} and name {}", saved.getId(), saved.getName());
        return brandMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BrandResponse update(Long id, BrandRequest request) {
        Brand existing = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        existing.setName(request.name());
        Brand saved = brandRepository.save(existing);
        log.info("Updated brand with id {}", saved.getId());
        return brandMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        brandRepository.delete(brand);
        log.info("Deleted brand with id {}", id);
    }
}
```

#### `VehicleTypeService` (interface) – `com.autotech.vehicle.service.VehicleTypeService`

```java
public interface VehicleTypeService {
    List<VehicleTypeResponse> getAll();
}
```

#### `VehicleTypeServiceImpl` – `com.autotech.vehicle.service.VehicleTypeServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleTypeServiceImpl implements VehicleTypeService {

    private final VehicleTypeRepository vehicleTypeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VehicleTypeResponse> getAll() {
        return vehicleTypeRepository.findAll().stream()
                .map(vt -> new VehicleTypeResponse(vt.getId(), vt.getName()))
                .toList();
    }
}
```

### 4.6 Controllers

All return `ResponseEntity<ApiResponse<T>>`. Use `@Valid` on request bodies.

#### `VehicleController` – `com.autotech.vehicle.controller.VehicleController`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/vehicles` | List all vehicles (paginated). Query params: `page`, `size`, `sort`. |
| `GET` | `/api/vehicles/{id}` | Get vehicle by ID. |
| `POST` | `/api/vehicles` | Create a new vehicle. Body: `VehicleRequest`. |
| `PUT` | `/api/vehicles/{id}` | Update an existing vehicle. Body: `VehicleRequest`. |
| `DELETE` | `/api/vehicles/{id}` | Delete a vehicle. |
| `GET` | `/api/vehicles/search?plate={plate}` | Search vehicles by plate (paginated). |
| `GET` | `/api/vehicles/by-client/{clientId}` | Get all vehicles for a client. |
| `GET` | `/api/vehicles/filter/by-brand?brandId={id}` | Filter by brand (paginated). |
| `GET` | `/api/vehicles/filter/by-year?year={year}` | Filter by year (paginated). |
| `GET` | `/api/vehicles/filter/by-model?model={model}` | Filter by model (paginated). |

```java
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleResponse>> create(@Valid @RequestBody VehicleRequest request) {
        VehicleResponse created = vehicleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Vehículo creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        vehicleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Vehículo eliminado", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> searchByPlate(
            @RequestParam String plate, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.searchByPlate(plate, pageable)));
    }

    @GetMapping("/by-client/{clientId}")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getByClientId(clientId)));
    }

    @GetMapping("/filter/by-brand")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> filterByBrand(
            @RequestParam Long brandId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.filterByBrand(brandId, pageable)));
    }

    @GetMapping("/filter/by-year")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> filterByYear(
            @RequestParam Integer year, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.filterByYear(year, pageable)));
    }

    @GetMapping("/filter/by-model")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> filterByModel(
            @RequestParam String model, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.filterByModel(model, pageable)));
    }
}
```

#### `BrandController` – `com.autotech.vehicle.controller.BrandController`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/brands` | List all brands. |
| `GET` | `/api/brands/{id}` | Get brand by ID. |
| `POST` | `/api/brands` | Create a new brand. Body: `BrandRequest`. |
| `PUT` | `/api/brands/{id}` | Update a brand. Body: `BrandRequest`. |
| `DELETE` | `/api/brands/{id}` | Delete a brand. |

```java
@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(brandService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(brandService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BrandResponse>> create(@Valid @RequestBody BrandRequest request) {
        BrandResponse created = brandService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Marca creada", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody BrandRequest request) {
        return ResponseEntity.ok(ApiResponse.success(brandService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        brandService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Marca eliminada", null));
    }
}
```

#### `VehicleTypeController` – `com.autotech.vehicle.controller.VehicleTypeController`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/vehicle-types` | List all vehicle types. |

```java
@RestController
@RequestMapping("/api/vehicle-types")
@RequiredArgsConstructor
public class VehicleTypeController {

    private final VehicleTypeService vehicleTypeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleTypeResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(vehicleTypeService.getAll()));
    }
}
```

---

## 5. Frontend

### 5.1 Types

#### `src/types/vehicle.ts`

```ts
export interface VehicleResponse {
  id: number;
  clientId: number;
  clientFirstName: string;
  clientLastName: string;
  clientDni: string | null;
  plate: string;
  chassisNumber: string | null;
  engineNumber: string | null;
  brandId: number | null;
  brandName: string | null;
  model: string | null;
  year: number | null;
  vehicleTypeId: number | null;
  vehicleTypeName: string | null;
  observations: string | null;
  inRepair: boolean;
  createdAt: string;
}

export interface VehicleRequest {
  clientId: number;
  plate: string;
  chassisNumber: string | null;
  engineNumber: string | null;
  brandId: number | null;
  model: string | null;
  year: number | null;
  vehicleTypeId: number | null;
  observations: string | null;
}

export interface BrandResponse {
  id: number;
  name: string;
  createdAt: string;
}

export interface BrandRequest {
  name: string;
}

export interface VehicleTypeResponse {
  id: number;
  name: string;
}
```

### 5.2 API Layer

#### `src/api/vehicles.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { VehicleResponse, VehicleRequest } from "@/types/vehicle";
import type { PaginatedResponse } from "@/types/api";

export const vehiclesApi = {
  getAll: (page: number, size: number) =>
    apiClient.get<ApiResponse<PaginatedResponse<VehicleResponse>>>("/vehicles", {
      params: { page, size },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<VehicleResponse>>(`/vehicles/${id}`),

  create: (data: VehicleRequest) =>
    apiClient.post<ApiResponse<VehicleResponse>>("/vehicles", data),

  update: (id: number, data: VehicleRequest) =>
    apiClient.put<ApiResponse<VehicleResponse>>(`/vehicles/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/vehicles/${id}`),

  searchByPlate: (plate: string, page: number, size: number) =>
    apiClient.get<ApiResponse<PaginatedResponse<VehicleResponse>>>("/vehicles/search", {
      params: { plate, page, size },
    }),

  getByClient: (clientId: number) =>
    apiClient.get<ApiResponse<VehicleResponse[]>>(`/vehicles/by-client/${clientId}`),

  filterByBrand: (brandId: number, page: number, size: number) =>
    apiClient.get<ApiResponse<PaginatedResponse<VehicleResponse>>>("/vehicles/filter/by-brand", {
      params: { brandId, page, size },
    }),

  filterByYear: (year: number, page: number, size: number) =>
    apiClient.get<ApiResponse<PaginatedResponse<VehicleResponse>>>("/vehicles/filter/by-year", {
      params: { year, page, size },
    }),

  filterByModel: (model: string, page: number, size: number) =>
    apiClient.get<ApiResponse<PaginatedResponse<VehicleResponse>>>("/vehicles/filter/by-model", {
      params: { model, page, size },
    }),
};
```

#### `src/api/brands.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { BrandResponse, BrandRequest } from "@/types/vehicle";

export const brandsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<BrandResponse[]>>("/brands"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<BrandResponse>>(`/brands/${id}`),

  create: (data: BrandRequest) =>
    apiClient.post<ApiResponse<BrandResponse>>("/brands", data),

  update: (id: number, data: BrandRequest) =>
    apiClient.put<ApiResponse<BrandResponse>>(`/brands/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/brands/${id}`),
};
```

#### `src/api/vehicleTypes.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { VehicleTypeResponse } from "@/types/vehicle";

export const vehicleTypesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<VehicleTypeResponse[]>>("/vehicle-types"),
};
```

### 5.3 Pages

#### `VehiclesPage` – `src/pages/VehiclesPage.tsx`

- Route: `/vehiculos`
- Renders `VehicleList` with search, filters, and a "Nuevo Vehículo" button.
- Opens `VehicleForm` dialog for create/edit.
- Default export (page-level component).

### 5.4 Components

All under `src/features/vehicles/`.

#### `VehicleList.tsx`

- Uses MUI `DataGrid` (from `@mui/x-data-grid`).
- Columns:
  | Column Header (Spanish) | Field | Notes |
  |---|---|---|
  | Patente | `plate` | |
  | Modelo | `model` | |
  | Propietario | `clientFirstName + ' ' + clientLastName` | Concatenated |
  | Documento Propietario | `clientDni` | |
  | En arreglo | `inRepair` | Renders "Sí" (green chip) or "No" (grey chip) |
  | Acción | — | Icon buttons: Edit (`EditIcon`), Delete (`DeleteIcon`), View (`VisibilityIcon`) |
- Pagination: `pageSize = 12`, server-side pagination via `paginationMode="server"`.
- Search bar (top left): `TextField` with search icon, debounced (300ms), calls `searchByPlate`.
- Filter button (top right): Opens `VehicleFilters` popover/menu.

#### `VehicleForm.tsx`

- MUI `Dialog` for create and edit.
- Fields:
  | Field Label (Spanish) | Component | Notes |
  |---|---|---|
  | Cliente | `Autocomplete` | Loads registered clients. Has "+ Nuevo Cliente" option at end. Selecting it navigates to `/clientes` (client registration). |
  | Patente | `TextField` | Required. Validated on blur (uniqueness check via API). |
  | N° Chasis | `TextField` | Optional. |
  | N° Motor | `TextField` | Optional. |
  | Marca | `Autocomplete` with `freeSolo` or "Agregar marca" option | Loads brands from API. If brand not found, user can type a new name → "Agregar \"{name}\"" option appears. Selecting it calls `brandsApi.create()` inline. |
  | Modelo | `TextField` | Optional. |
  | Año | `TextField` (type="number") | Optional. |
  | Tipo de vehículo | `Select` / `Autocomplete` | Options from `vehicleTypesApi.getAll()`: Auto, Camioneta, Utilitario. |
  | Observaciones | `TextField` multiline | Optional. |
- Submit button: "Guardar" (calls create or update).
- Cancel button: "Cancelar" (closes dialog).

#### `VehicleFilters.tsx`

- Popover/menu triggered by "Filtros" button in `VehicleList`.
- Filter options:
  - **Marca** — `Autocomplete` loading brands.
  - **Año** — `TextField` (type="number").
  - **Modelo** — `TextField`.
- "Aplicar" button applies the selected filter.
- "Limpiar" button clears all filters and reloads the full list.

### 5.5 Hooks

#### `src/features/vehicles/useVehicles.ts`

```ts
export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);

  // fetchVehicles(page, size) — calls vehiclesApi.getAll
  // searchByPlate(plate) — calls vehiclesApi.searchByPlate
  // applyFilter(type, value) — calls appropriate filter endpoint
  // clearFilters() — resets to getAll

  return { vehicles, loading, error, totalElements, page, setPage, fetchVehicles, searchByPlate, applyFilter, clearFilters };
}
```

#### `src/features/vehicles/useBrands.ts`

```ts
export function useBrands() {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetches all brands on mount
  // createBrand(name) — calls brandsApi.create and refreshes list

  return { brands, loading, createBrand };
}
```

#### `src/features/vehicles/useVehicleTypes.ts`

```ts
export function useVehicleTypes() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetches all vehicle types on mount

  return { vehicleTypes, loading };
}
```

### 5.6 Routes

In `src/routes/`:

```ts
{
  path: "/vehiculos",
  element: <VehiclesPage />,  // lazy loaded
}
```

---

## 6. Business Rules

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | **Plate must be unique.** | Backend: `existsByPlate` / `existsByPlateAndIdNot` check in `VehicleServiceImpl.create()` / `update()`. Frontend: on-blur validation calling a hypothetical check endpoint or relying on API error response. |
| 2 | **Client must exist.** | Backend: `VehicleServiceImpl` calls `ClientService.getById()` which throws `ResourceNotFoundException` if not found. Frontend: `VehicleForm` uses an `Autocomplete` that only shows existing clients. |
| 3 | **If client not found, redirect to client registration.** | Frontend only: the `Autocomplete` shows a "+ Nuevo Cliente" option at the bottom. Clicking it navigates to `/clientes` (or opens the client registration modal). |
| 4 | **Brand can be created inline.** | Frontend: `VehicleForm` brand `Autocomplete` shows "Agregar \"{typed}\"\". Backend: `POST /api/brands` is called before saving the vehicle. The newly created `brandId` is then included in the `VehicleRequest`. |
| 5 | **Brand name must be unique (case-insensitive).** | Backend: `BrandServiceImpl.create()` checks `existsByNameIgnoreCase`. |
| 6 | **Vehicle types are pre-seeded and read-only from the UI.** | Only `GET /api/vehicle-types` is exposed. No create/update/delete endpoints for vehicle types. Seed data: AUTO, CAMIONETA, UTILITARIO. |
| 7 | **"En arreglo" (In Repair) is a derived/computed field.** | Backend: computed at service level by checking if any `repair_order` for this vehicle has a status ≠ `ENTREGADO`. Not stored in the `vehicles` table. |
| 8 | **Max 12 rows per page.** | Frontend: `pageSize = 12` on the `DataGrid`. Backend: respects `Pageable` param `size=12`. |
| 9 | **Deletion should be confirmed.** | Frontend: show a confirmation `Dialog` before calling `DELETE /api/vehicles/{id}`. |

---

## 7. Testing

### 7.1 Backend Unit Tests

All follow the **Given-When-Then** naming convention and **Arrange-Act-Assert** structure. Use `@ExtendWith(MockitoExtension.class)`, mock repositories/mappers, use AssertJ.

#### `VehicleServiceImplTest`

| Test Method | Description |
|---|---|
| `givenValidId_whenGetById_thenReturnVehicleResponse` | Happy path: vehicle found. |
| `givenInvalidId_whenGetById_thenThrowResourceNotFoundException` | Vehicle not found → exception. |
| `givenValidRequest_whenCreate_thenReturnCreatedVehicle` | Happy path: create with valid client, brand, type. |
| `givenDuplicatePlate_whenCreate_thenThrowIllegalArgumentException` | Plate already exists → error. |
| `givenNonExistentClient_whenCreate_thenThrowResourceNotFoundException` | Client ID doesn't exist → error. |
| `givenValidRequest_whenUpdate_thenReturnUpdatedVehicle` | Happy path: update all fields. |
| `givenDuplicatePlateOnOtherVehicle_whenUpdate_thenThrowIllegalArgumentException` | Plate belongs to another vehicle → error. |
| `givenValidId_whenDelete_thenVehicleIsRemoved` | Happy path: delete. |
| `givenInvalidId_whenDelete_thenThrowResourceNotFoundException` | Vehicle not found → exception. |
| `givenPlateQuery_whenSearchByPlate_thenReturnMatchingVehicles` | Partial match search. |
| `givenClientId_whenGetByClientId_thenReturnClientVehicles` | List vehicles for a client. |

#### `BrandServiceImplTest`

| Test Method | Description |
|---|---|
| `givenValidRequest_whenCreate_thenReturnCreatedBrand` | Happy path. |
| `givenDuplicateName_whenCreate_thenThrowIllegalArgumentException` | Duplicate brand name → error. |
| `givenValidId_whenGetById_thenReturnBrandResponse` | Happy path. |
| `givenInvalidId_whenGetById_thenThrowResourceNotFoundException` | Not found → exception. |
| `whenGetAll_thenReturnAllBrands` | List all brands. |

#### `VehicleTypeServiceImplTest`

| Test Method | Description |
|---|---|
| `whenGetAll_thenReturnAllVehicleTypes` | Returns seeded types. |

### 7.2 Backend Integration Tests

Use `@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`, real DB via Testcontainers.

#### `VehicleControllerIT`

| Test | Description |
|---|---|
| `givenValidRequest_whenCreateVehicle_thenReturnCreatedStatus` | POST `/api/vehicles` → 201. |
| `givenExistingVehicle_whenGetById_thenReturnOk` | GET `/api/vehicles/{id}` → 200. |
| `givenDuplicatePlate_whenCreateVehicle_thenReturn400` | POST → 400 with error message. |
| `givenPlateQuery_whenSearch_thenReturnMatchingResults` | GET `/api/vehicles/search?plate=AB` → paginated results. |

#### `BrandControllerIT`

| Test | Description |
|---|---|
| `givenValidRequest_whenCreateBrand_thenReturnCreatedStatus` | POST `/api/brands` → 201. |
| `givenDuplicateName_whenCreateBrand_thenReturn400` | POST → 400 with error message. |

### 7.3 Frontend Tests

Use Vitest + React Testing Library.

#### `VehicleList.test.tsx`

- Renders the DataGrid with mock data.
- Displays correct columns (Patente, Modelo, Propietario, Documento, En arreglo, Acción).
- Search input filters by plate.
- Pagination controls work (page navigation).

#### `VehicleForm.test.tsx`

- Renders all form fields.
- Client Autocomplete loads options.
- Brand Autocomplete loads options and shows "Agregar" option.
- Validation: required fields show errors when empty.
- Submit calls the correct API function (create or update).

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend

- [ ] Create `Vehicle` entity with all fields and relationships (`@ManyToOne` to `Client`, `Brand`, `VehicleType`)
- [ ] Create `Brand` entity with `name` field and unique constraint
- [ ] Create `VehicleType` entity with `name` field and unique constraint
- [ ] Create `VehicleRepository` with `findAll` (with `@EntityGraph`), `findById`, `findByClientId`, `existsByPlate`, `existsByPlateAndIdNot`, `findByPlateContainingIgnoreCase`, `findByBrandId`, `findByYear`, `findByModel`
- [ ] Create `BrandRepository` with `findByNameIgnoreCase`, `existsByNameIgnoreCase`
- [ ] Create `VehicleTypeRepository` (JpaRepository, no custom queries)
- [ ] Create `VehicleRequest` record with Jakarta Validation annotations
- [ ] Create `VehicleResponse` record (includes flattened client/brand/vehicleType fields and `inRepair`)
- [ ] Create `BrandRequest` record with Jakarta Validation annotations
- [ ] Create `BrandResponse` record
- [ ] Create `VehicleTypeResponse` record
- [ ] Create `VehicleMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md)
- [ ] Create `BrandMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md)
- [ ] Create `VehicleService` interface with methods: `getAll`, `getById`, `create`, `update`, `delete`, `searchByPlate`, `getByClientId`, `filterByBrand`, `filterByYear`, `filterByModel`
- [ ] Create `VehicleServiceImpl` with full logic:
  - [ ] `getAll` — paginated list with repair status
  - [ ] `getById` — find or throw `ResourceNotFoundException`, include repair status
  - [ ] `create` — validate plate uniqueness, resolve client/brand/vehicleType, map and save
  - [ ] `update` — find or throw, validate plate uniqueness excluding self, resolve relationships, update fields
  - [ ] `delete` — find or throw, delete
  - [ ] `searchByPlate` — partial match search by plate
  - [ ] `getByClientId` — list vehicles for a client
  - [ ] `filterByBrand` — filter by brand ID with pagination
  - [ ] `filterByYear` — filter by year with pagination
  - [ ] `filterByModel` — filter by model with pagination
  - [ ] Private helpers: `toResponseWithRepairStatus`, `resolveClient`, `resolveBrand`, `resolveVehicleType`
- [ ] Create `BrandService` interface with methods: `getAll`, `getById`, `create`, `update`, `delete`
- [ ] Create `BrandServiceImpl` with full logic:
  - [ ] `getAll` — list all brands
  - [ ] `getById` — find or throw
  - [ ] `create` — validate name uniqueness (case-insensitive), map and save
  - [ ] `update` — find or throw, update name
  - [ ] `delete` — find or throw, delete
- [ ] Create `VehicleTypeService` interface with method: `getAll`
- [ ] Create `VehicleTypeServiceImpl` with `getAll` logic
- [ ] Create `VehicleController` with all endpoints:
  - [ ] `GET /api/vehicles` — list all (paginated)
  - [ ] `GET /api/vehicles/{id}` — get by ID
  - [ ] `POST /api/vehicles` — create
  - [ ] `PUT /api/vehicles/{id}` — update
  - [ ] `DELETE /api/vehicles/{id}` — delete
  - [ ] `GET /api/vehicles/search?plate={plate}` — search by plate
  - [ ] `GET /api/vehicles/by-client/{clientId}` — get by client
  - [ ] `GET /api/vehicles/filter/by-brand?brandId={id}` — filter by brand
  - [ ] `GET /api/vehicles/filter/by-year?year={year}` — filter by year
  - [ ] `GET /api/vehicles/filter/by-model?model={model}` — filter by model
- [ ] Create `BrandController` with all endpoints:
  - [ ] `GET /api/brands` — list all
  - [ ] `GET /api/brands/{id}` — get by ID
  - [ ] `POST /api/brands` — create
  - [ ] `PUT /api/brands/{id}` — update
  - [ ] `DELETE /api/brands/{id}` — delete
- [ ] Create `VehicleTypeController` with endpoint:
  - [ ] `GET /api/vehicle-types` — list all
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [ ] Create types file: `src/types/vehicle.ts` (`VehicleResponse`, `VehicleRequest`, `BrandResponse`, `BrandRequest`, `VehicleTypeResponse`)
- [ ] Create API layer: `src/api/vehicles.ts` (all vehicle endpoints)
- [ ] Create API layer: `src/api/brands.ts` (all brand endpoints)
- [ ] Create API layer: `src/api/vehicleTypes.ts` (getAll endpoint)
- [ ] Create `useVehicles` hook (`src/features/vehicles/useVehicles.ts`)
- [ ] Create `useBrands` hook (`src/features/vehicles/useBrands.ts`)
- [ ] Create `useVehicleTypes` hook (`src/features/vehicles/useVehicleTypes.ts`)
- [ ] Create `VehiclesPage` (`src/pages/VehiclesPage.tsx`)
- [ ] Create `VehicleList` component with DataGrid, server-side pagination, search, filter button
- [ ] Create `VehicleForm` component (Dialog for create/edit with client Autocomplete, brand Autocomplete with inline creation, vehicle type Select)
- [ ] Create `VehicleFilters` component (Popover with brand, year, model filters)
- [ ] Register route `/vehiculos` with lazy loading
- [ ] Verify frontend compiles
- [ ] Verify frontend runs

### 8.3 Business Rules Verification

- [ ] Plate must be unique (enforced on create and update, excluding self on update)
- [ ] Client must exist before creating a vehicle (resolved via `ClientService`)
- [ ] If client not found, frontend redirects to client registration ("+ Nuevo Cliente" option)
- [ ] Brand can be created inline from the vehicle form (`POST /api/brands` called before saving vehicle)
- [ ] Brand name must be unique (case-insensitive)
- [ ] Vehicle types are pre-seeded and read-only (AUTO, CAMIONETA, UTILITARIO) — only GET endpoint exposed
- [ ] "En arreglo" (inRepair) is a computed field derived from active repair orders (not stored in DB)
- [ ] Max 12 rows per page in DataGrid and backend pagination
- [ ] Deletion shows a confirmation dialog before executing

### 8.4 Testing

- [ ] `VehicleServiceImplTest` — unit tests (11 test methods: getById, create, update, delete, search, filters)
- [ ] `BrandServiceImplTest` — unit tests (5 test methods: create, duplicate name, getById, not found, getAll)
- [ ] `VehicleTypeServiceImplTest` — unit tests (1 test method: getAll)
- [ ] `VehicleControllerIT` — integration tests (4 test methods: create, getById, duplicate plate, search)
- [ ] `BrandControllerIT` — integration tests (2 test methods: create, duplicate name)
- [ ] `VehicleList.test.tsx` — DataGrid rendering, columns, search, pagination
- [ ] `VehicleForm.test.tsx` — form fields, client/brand Autocomplete, validation, submit

---

## Appendix: File Checklist

### Backend (`backend/src/main/java/com/autotech/vehicle/`)

```
model/
  Vehicle.java
  Brand.java
  VehicleType.java
repository/
  VehicleRepository.java
  BrandRepository.java
  VehicleTypeRepository.java
dto/
  VehicleRequest.java
  VehicleResponse.java
  BrandRequest.java
  BrandResponse.java
  VehicleTypeResponse.java
  VehicleMapper.java
  BrandMapper.java
service/
  VehicleService.java
  VehicleServiceImpl.java
  BrandService.java
  BrandServiceImpl.java
  VehicleTypeService.java
  VehicleTypeServiceImpl.java
controller/
  VehicleController.java
  BrandController.java
  VehicleTypeController.java
```

### Backend Tests (`backend/src/test/java/com/autotech/vehicle/`)

```
service/
  VehicleServiceImplTest.java
  BrandServiceImplTest.java
  VehicleTypeServiceImplTest.java
controller/
  VehicleControllerIT.java
  BrandControllerIT.java
```

### Frontend (`frontend/src/`)

```
types/
  vehicle.ts
api/
  vehicles.ts
  brands.ts
  vehicleTypes.ts
features/vehicles/
  VehicleList.tsx
  VehicleForm.tsx
  VehicleFilters.tsx
  useVehicles.ts
  useBrands.ts
  useVehicleTypes.ts
pages/
  VehiclesPage.tsx
```
