# 08 — Presupuestos (Estimates)

## 1. Overview

This feature implements full management for **Estimates (Presupuestos)** — documents that detail the proposed services and products for a vehicle repair, along with pricing, discounts, and taxes. Estimates can be created as **standalone** (from the `/presupuestos` list) or **within a repair order** (from the "Presupuesto" tab in repair order detail, replacing the placeholder from spec 06).

Key capabilities:
- CRUD for estimates with nested line items (services and products).
- Status workflow: `PENDIENTE` → `ACEPTADO` or `RECHAZADO` (one-way, no reverting).
- Integration with the **Services** and **Products** catalogs via autocomplete (names and prices are **snapshotted** — copied by value at creation time, not FK references).
- Read-only display of **mechanic observations** (`repair_orders.mechanic_notes`) and **inspection issues** (items with `PROBLEMA` or `REVISAR` status) when the estimate belongs to a repair order.
- "Facturar" action: converts an `ACEPTADO` estimate into an invoice by pre-loading its data into the invoice creation screen.
- Summary calculation: subtotals for services and products, discount %, tax %, and final price.

**Dependencies**: Clients (spec 02), Vehicles (spec 03), Services & Products catalog (spec 04), Repair Orders (spec 06), Inspections (spec 07).

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/presupuestos` |
| Base | `develop` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add Estimate, EstimateService, EstimateProduct entities`
- `feat: add estimate CRUD endpoints`
- `feat: add EstimatesPage with DataGrid`
- `feat: add EstimateDetailPage with services and products grids`
- `feat: add EstimateTab component for repair order detail`
- `test: add unit tests for EstimateService`

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. No new migration needed.

### 3.1 `estimates`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `client_id` | `BIGINT` | NOT NULL, FK → `clients(id)` |
| `vehicle_id` | `BIGINT` | NOT NULL, FK → `vehicles(id)` |
| `repair_order_id` | `BIGINT` | nullable, FK → `repair_orders(id)` |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'PENDIENTE'`, CHECK (`PENDIENTE`, `ACEPTADO`, `RECHAZADO`) |
| `discount_percentage` | `NUMERIC(5,2)` | NOT NULL, DEFAULT 0, CHECK (0–100) |
| `tax_percentage` | `NUMERIC(5,2)` | NOT NULL, DEFAULT 0, CHECK (0–100) |
| `total` | `NUMERIC(12,2)` | nullable (computed on save) |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Indexes**: `idx_estimates_client_id`, `idx_estimates_repair_order_id`.

### 3.2 `estimate_services`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `estimate_id` | `BIGINT` | NOT NULL, FK → `estimates(id)` ON DELETE CASCADE |
| `service_name` | `VARCHAR(255)` | NOT NULL |
| `price` | `NUMERIC(12,2)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_estimate_services_estimate_id`.

### 3.3 `estimate_products`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `estimate_id` | `BIGINT` | NOT NULL, FK → `estimates(id)` ON DELETE CASCADE |
| `product_name` | `VARCHAR(255)` | NOT NULL |
| `quantity` | `INTEGER` | NOT NULL |
| `unit_price` | `NUMERIC(12,2)` | NOT NULL |
| `total_price` | `NUMERIC(12,2)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_estimate_products_estimate_id`.

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.estimate/
├── controller/
│   └── EstimateController.java
├── service/
│   ├── EstimateService.java               (interface)
│   └── EstimateServiceImpl.java           (implementation)
├── repository/
│   ├── EstimateRepository.java
│   ├── EstimateServiceItemRepository.java
│   └── EstimateProductRepository.java
├── model/
│   ├── Estimate.java
│   ├── EstimateStatus.java                (enum)
│   ├── EstimateServiceItem.java
│   └── EstimateProduct.java
└── dto/
    ├── EstimateRequest.java
    ├── EstimateServiceItemRequest.java
    ├── EstimateProductRequest.java
    ├── EstimateResponse.java
    ├── EstimateDetailResponse.java
    ├── EstimateServiceItemResponse.java
    ├── EstimateProductResponse.java
    ├── InspectionIssueResponse.java
    ├── EstimateInvoiceDataResponse.java
    └── EstimateMapper.java
```

> **Naming rationale**: The line-item entity is named `EstimateServiceItem` (not `EstimateService`) to avoid clashing with the service-layer interface `EstimateService`.

---

### 4.2 Enum — `EstimateStatus`

```java
package com.autotech.estimate.model;

public enum EstimateStatus {
    PENDIENTE,
    ACEPTADO,
    RECHAZADO
}
```

---

### 4.3 Entities

#### `Estimate`

```java
@Entity
@Table(name = "estimates")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class Estimate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_order_id")
    private RepairOrder repairOrder;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EstimateStatus status = EstimateStatus.PENDIENTE;

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "tax_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @Column(name = "total", precision = 12, scale = 2)
    private BigDecimal total;

    @OneToMany(mappedBy = "estimate", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EstimateServiceItem> services = new ArrayList<>();

    @OneToMany(mappedBy = "estimate", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EstimateProduct> products = new ArrayList<>();
}
```

#### `EstimateServiceItem`

```java
@Entity
@Table(name = "estimate_services")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class EstimateServiceItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estimate_id", nullable = false)
    private Estimate estimate;

    @Column(name = "service_name", nullable = false, length = 255)
    private String serviceName;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
}
```

#### `EstimateProduct`

```java
@Entity
@Table(name = "estimate_products")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class EstimateProduct extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estimate_id", nullable = false)
    private Estimate estimate;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;
}
```

---

### 4.4 Repositories

#### `EstimateRepository`

```java
@Repository
public interface EstimateRepository extends JpaRepository<Estimate, Long> {

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder"})
    Optional<Estimate> findWithDetailsById(Long id);

    Page<Estimate> findByClientFirstNameContainingIgnoreCaseOrClientLastNameContainingIgnoreCase(
            String firstName, String lastName, Pageable pageable);

    Page<Estimate> findByVehiclePlateContainingIgnoreCase(String plate, Pageable pageable);

    Page<Estimate> findByStatus(EstimateStatus status, Pageable pageable);

    Optional<Estimate> findByRepairOrderId(Long repairOrderId);

    List<Estimate> findAllByRepairOrderId(Long repairOrderId);

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder"})
    Page<Estimate> findAll(Pageable pageable);

    @Query("""
        SELECT e FROM Estimate e
        LEFT JOIN e.client c
        LEFT JOIN e.vehicle v
        WHERE (:clientName IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :clientName, '%'))
               OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :clientName, '%')))
        AND (:plate IS NULL OR LOWER(v.plate) LIKE LOWER(CONCAT('%', :plate, '%')))
        AND (:status IS NULL OR e.status = :status)
    """)
    Page<Estimate> search(
            @Param("clientName") String clientName,
            @Param("plate") String plate,
            @Param("status") EstimateStatus status,
            Pageable pageable);
}
```

#### `EstimateServiceItemRepository`

```java
@Repository
public interface EstimateServiceItemRepository extends JpaRepository<EstimateServiceItem, Long> {

    List<EstimateServiceItem> findByEstimateId(Long estimateId);

    void deleteByEstimateId(Long estimateId);
}
```

#### `EstimateProductRepository`

```java
@Repository
public interface EstimateProductRepository extends JpaRepository<EstimateProduct, Long> {

    List<EstimateProduct> findByEstimateId(Long estimateId);

    void deleteByEstimateId(Long estimateId);
}
```

---

### 4.5 DTOs

#### Request DTOs

```java
public record EstimateServiceItemRequest(
        @NotBlank(message = "El nombre del servicio es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String serviceName,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "El precio debe tener como máximo 10 dígitos enteros y 2 decimales")
        BigDecimal price
) {}

public record EstimateProductRequest(
        @NotBlank(message = "El nombre del producto es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String productName,

        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser al menos 1")
        Integer quantity,

        @NotNull(message = "El precio unitario es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio unitario no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "El precio unitario debe tener como máximo 10 dígitos enteros y 2 decimales")
        BigDecimal unitPrice
) {}

public record EstimateRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long clientId,

        @NotNull(message = "El vehículo es obligatorio")
        Long vehicleId,

        Long repairOrderId,  // nullable — only set when creating from a repair order

        @DecimalMin(value = "0.00", message = "El descuento no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El descuento no puede superar el 100%")
        @Digits(integer = 3, fraction = 2)
        BigDecimal discountPercentage,

        @DecimalMin(value = "0.00", message = "El impuesto no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El impuesto no puede superar el 100%")
        @Digits(integer = 3, fraction = 2)
        BigDecimal taxPercentage,

        @Valid
        List<EstimateServiceItemRequest> services,

        @Valid
        List<EstimateProductRequest> products
) {}
```

#### Response DTOs

```java
public record EstimateServiceItemResponse(
        Long id,
        String serviceName,
        BigDecimal price
) {}

public record EstimateProductResponse(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}

// Used in the list view (EstimatesPage grid)
public record EstimateResponse(
        Long id,
        Long clientId,
        String clientFullName,
        Long vehicleId,
        String vehiclePlate,
        String vehicleModel,
        Long repairOrderId,
        EstimateStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

// Used in the detail view (EstimateDetailPage / EstimateTab)
public record EstimateDetailResponse(
        Long id,
        Long clientId,
        String clientFullName,
        String clientDni,
        String clientPhone,
        String clientEmail,
        Long vehicleId,
        String vehiclePlate,
        String vehicleBrand,
        String vehicleModel,
        Integer vehicleYear,
        Long repairOrderId,
        String mechanicNotes,                   // from repair_orders.mechanic_notes (readonly)
        List<InspectionIssueResponse> inspectionIssues,  // items with PROBLEMA/REVISAR (readonly)
        EstimateStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        List<EstimateServiceItemResponse> services,
        List<EstimateProductResponse> products,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

// Represents an inspection item with PROBLEMA or REVISAR status
public record InspectionIssueResponse(
        Long inspectionItemId,
        String itemName,        // from inspection_template_items.name
        String status,          // "PROBLEMA" or "REVISAR"
        String comment          // from inspection_items.comment
) {}

// Data structure returned for pre-loading invoice creation from an accepted estimate
public record EstimateInvoiceDataResponse(
        Long estimateId,
        Long clientId,
        Long vehicleId,
        Long repairOrderId,
        List<EstimateServiceItemResponse> services,
        List<EstimateProductResponse> products,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total
) {}
```

---

### 4.6 Mapper — `EstimateMapper`

```java
@Mapper(componentModel = "spring")
public interface EstimateMapper {

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFullName", expression = "java(entity.getClient().getFirstName() + \" \" + entity.getClient().getLastName())")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehiclePlate", source = "vehicle.plate")
    @Mapping(target = "vehicleModel", source = "vehicle.model")
    @Mapping(target = "repairOrderId", source = "repairOrder.id")
    EstimateResponse toResponse(Estimate entity);

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFullName", expression = "java(entity.getClient().getFirstName() + \" \" + entity.getClient().getLastName())")
    @Mapping(target = "clientDni", source = "client.dni")
    @Mapping(target = "clientPhone", source = "client.phone")
    @Mapping(target = "clientEmail", source = "client.email")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehiclePlate", source = "vehicle.plate")
    @Mapping(target = "vehicleBrand", expression = "java(entity.getVehicle().getBrand() != null ? entity.getVehicle().getBrand().getName() : null)")
    @Mapping(target = "vehicleModel", source = "vehicle.model")
    @Mapping(target = "vehicleYear", source = "vehicle.year")
    @Mapping(target = "repairOrderId", source = "repairOrder.id")
    @Mapping(target = "mechanicNotes", source = "repairOrder.mechanicNotes")
    @Mapping(target = "inspectionIssues", ignore = true) // populated separately in service
    EstimateDetailResponse toDetailResponse(Estimate entity);

    EstimateServiceItemResponse toServiceItemResponse(EstimateServiceItem entity);

    EstimateProductResponse toProductResponse(EstimateProduct entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "client", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    @Mapping(target = "repairOrder", ignore = true)
    @Mapping(target = "services", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "total", ignore = true)
    Estimate toEntity(EstimateRequest request);

    @Mapping(target = "estimateId", source = "id")
    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "repairOrderId", source = "repairOrder.id")
    EstimateInvoiceDataResponse toInvoiceDataResponse(Estimate entity);
}
```

---

### 4.7 Service — `EstimateService`

#### Interface

```java
public interface EstimateService {

    Page<EstimateResponse> getAll(Pageable pageable);

    Page<EstimateResponse> search(String clientName, String plate, EstimateStatus status, Pageable pageable);

    EstimateDetailResponse getById(Long id);

    EstimateDetailResponse getByRepairOrderId(Long repairOrderId);

    EstimateDetailResponse create(EstimateRequest request);

    EstimateDetailResponse update(Long id, EstimateRequest request);

    EstimateDetailResponse approve(Long id);

    EstimateDetailResponse reject(Long id);

    void delete(Long id);

    BigDecimal calculateTotal(List<EstimateServiceItemRequest> services,
                              List<EstimateProductRequest> products,
                              BigDecimal discountPercentage,
                              BigDecimal taxPercentage);

    EstimateInvoiceDataResponse convertToInvoiceData(Long estimateId);

    List<InspectionIssueResponse> getInspectionIssues(Long repairOrderId);
}
```

#### Implementation — `EstimateServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class EstimateServiceImpl implements EstimateService {

    private final EstimateRepository estimateRepository;
    private final EstimateMapper estimateMapper;
    private final ClientRepository clientRepository;       // from client module
    private final VehicleRepository vehicleRepository;     // from vehicle module
    private final RepairOrderRepository repairOrderRepository; // from repairorder module
    private final InspectionRepository inspectionRepository;   // from inspection module
    private final InspectionItemRepository inspectionItemRepository; // from inspection module

    @Override
    @Transactional(readOnly = true)
    public Page<EstimateResponse> getAll(Pageable pageable) {
        log.debug("Fetching all estimates");
        return estimateRepository.findAll(pageable)
                .map(estimateMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EstimateResponse> search(String clientName, String plate, EstimateStatus status, Pageable pageable) {
        log.debug("Searching estimates - clientName: '{}', plate: '{}', status: '{}'", clientName, plate, status);
        return estimateRepository.search(clientName, plate, status, pageable)
                .map(estimateMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public EstimateDetailResponse getById(Long id) {
        log.debug("Fetching estimate with id {}", id);
        Estimate entity = estimateRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        EstimateDetailResponse response = estimateMapper.toDetailResponse(entity);
        // Populate inspection issues if linked to a repair order
        if (entity.getRepairOrder() != null) {
            List<InspectionIssueResponse> issues = getInspectionIssues(entity.getRepairOrder().getId());
            // Reconstruct response with issues (since records are immutable)
            response = buildDetailResponseWithIssues(response, issues);
        }
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public EstimateDetailResponse getByRepairOrderId(Long repairOrderId) {
        log.debug("Fetching estimate for repair order {}", repairOrderId);
        Estimate entity = estimateRepository.findByRepairOrderId(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate for RepairOrder", repairOrderId));
        EstimateDetailResponse response = estimateMapper.toDetailResponse(entity);
        List<InspectionIssueResponse> issues = getInspectionIssues(repairOrderId);
        return buildDetailResponseWithIssues(response, issues);
    }

    @Override
    @Transactional
    public EstimateDetailResponse create(EstimateRequest request) {
        // 1. Resolve client
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));
        // 2. Resolve vehicle
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
        // 3. Optionally resolve repair order
        RepairOrder repairOrder = null;
        if (request.repairOrderId() != null) {
            repairOrder = repairOrderRepository.findById(request.repairOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", request.repairOrderId()));
        }
        // 4. Build entity
        Estimate entity = estimateMapper.toEntity(request);
        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setRepairOrder(repairOrder);
        entity.setStatus(EstimateStatus.PENDIENTE);
        // 5. Add child entities (snapshot line items)
        addChildEntities(entity, request);
        // 6. Calculate and set total
        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), request.taxPercentage());
        entity.setTotal(total);
        // 7. Save
        Estimate saved = estimateRepository.save(entity);
        log.info("Created estimate with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public EstimateDetailResponse update(Long id, EstimateRequest request) {
        Estimate entity = estimateRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        // Only PENDIENTE estimates can be edited
        if (entity.getStatus() != EstimateStatus.PENDIENTE) {
            throw new BusinessRuleException("Solo se pueden editar presupuestos en estado PENDIENTE");
        }
        // Resolve client and vehicle
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setDiscountPercentage(request.discountPercentage() != null ? request.discountPercentage() : BigDecimal.ZERO);
        entity.setTaxPercentage(request.taxPercentage() != null ? request.taxPercentage() : BigDecimal.ZERO);
        // Replace children: clear existing, add new
        entity.getServices().clear();
        entity.getProducts().clear();
        addChildEntities(entity, request);
        // Recalculate total
        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), request.taxPercentage());
        entity.setTotal(total);
        Estimate saved = estimateRepository.save(entity);
        log.info("Updated estimate with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public EstimateDetailResponse approve(Long id) {
        Estimate entity = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        if (entity.getStatus() != EstimateStatus.PENDIENTE) {
            throw new BusinessRuleException("Solo se pueden aprobar presupuestos en estado PENDIENTE");
        }
        entity.setStatus(EstimateStatus.ACEPTADO);
        Estimate saved = estimateRepository.save(entity);
        log.info("Approved estimate with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public EstimateDetailResponse reject(Long id) {
        Estimate entity = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", id));
        if (entity.getStatus() != EstimateStatus.PENDIENTE) {
            throw new BusinessRuleException("Solo se pueden rechazar presupuestos en estado PENDIENTE");
        }
        entity.setStatus(EstimateStatus.RECHAZADO);
        Estimate saved = estimateRepository.save(entity);
        log.info("Rejected estimate with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!estimateRepository.existsById(id)) {
            throw new ResourceNotFoundException("Estimate", id);
        }
        estimateRepository.deleteById(id);
        log.info("Deleted estimate with id {}", id);
    }

    @Override
    public BigDecimal calculateTotal(List<EstimateServiceItemRequest> services,
                                     List<EstimateProductRequest> products,
                                     BigDecimal discountPercentage,
                                     BigDecimal taxPercentage) {
        BigDecimal servicesTotal = BigDecimal.ZERO;
        if (services != null) {
            for (EstimateServiceItemRequest svc : services) {
                servicesTotal = servicesTotal.add(svc.price());
            }
        }
        BigDecimal productsTotal = BigDecimal.ZERO;
        if (products != null) {
            for (EstimateProductRequest prod : products) {
                productsTotal = productsTotal.add(prod.unitPrice().multiply(BigDecimal.valueOf(prod.quantity())));
            }
        }
        BigDecimal subtotal = servicesTotal.add(productsTotal);
        BigDecimal discount = discountPercentage != null
                ? subtotal.multiply(discountPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal afterDiscount = subtotal.subtract(discount);
        BigDecimal tax = taxPercentage != null
                ? afterDiscount.multiply(taxPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        return afterDiscount.add(tax);
    }

    @Override
    @Transactional(readOnly = true)
    public EstimateInvoiceDataResponse convertToInvoiceData(Long estimateId) {
        Estimate entity = estimateRepository.findWithDetailsById(estimateId)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate", estimateId));
        if (entity.getStatus() != EstimateStatus.ACEPTADO) {
            throw new BusinessRuleException("Solo se pueden facturar presupuestos en estado ACEPTADO");
        }
        EstimateInvoiceDataResponse response = estimateMapper.toInvoiceDataResponse(entity);
        // Populate line items
        List<EstimateServiceItemResponse> svcResponses = entity.getServices().stream()
                .map(estimateMapper::toServiceItemResponse)
                .toList();
        List<EstimateProductResponse> prodResponses = entity.getProducts().stream()
                .map(estimateMapper::toProductResponse)
                .toList();
        return new EstimateInvoiceDataResponse(
                response.estimateId(),
                response.clientId(),
                response.vehicleId(),
                response.repairOrderId(),
                svcResponses,
                prodResponses,
                response.discountPercentage(),
                response.taxPercentage(),
                response.total()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<InspectionIssueResponse> getInspectionIssues(Long repairOrderId) {
        // Find all inspections for the repair order, then collect items with PROBLEMA or REVISAR
        List<Inspection> inspections = inspectionRepository.findByRepairOrderId(repairOrderId);
        List<InspectionIssueResponse> issues = new ArrayList<>();
        for (Inspection inspection : inspections) {
            List<InspectionItem> items = inspectionItemRepository.findByInspectionId(inspection.getId());
            for (InspectionItem item : items) {
                if ("PROBLEMA".equals(item.getStatus()) || "REVISAR".equals(item.getStatus())) {
                    issues.add(new InspectionIssueResponse(
                            item.getId(),
                            item.getTemplateItem().getName(),
                            item.getStatus(),
                            item.getComment()
                    ));
                }
            }
        }
        return issues;
    }

    // --- Private helpers ---

    private void addChildEntities(Estimate entity, EstimateRequest request) {
        if (request.services() != null) {
            for (EstimateServiceItemRequest svcReq : request.services()) {
                EstimateServiceItem svc = EstimateServiceItem.builder()
                        .estimate(entity)
                        .serviceName(svcReq.serviceName())
                        .price(svcReq.price())
                        .build();
                entity.getServices().add(svc);
            }
        }
        if (request.products() != null) {
            for (EstimateProductRequest prodReq : request.products()) {
                EstimateProduct prod = EstimateProduct.builder()
                        .estimate(entity)
                        .productName(prodReq.productName())
                        .quantity(prodReq.quantity())
                        .unitPrice(prodReq.unitPrice())
                        .totalPrice(prodReq.unitPrice().multiply(BigDecimal.valueOf(prodReq.quantity())))
                        .build();
                entity.getProducts().add(prod);
            }
        }
    }

    private EstimateDetailResponse buildDetailResponseWithIssues(
            EstimateDetailResponse response, List<InspectionIssueResponse> issues) {
        return new EstimateDetailResponse(
                response.id(), response.clientId(), response.clientFullName(),
                response.clientDni(), response.clientPhone(), response.clientEmail(),
                response.vehicleId(), response.vehiclePlate(), response.vehicleBrand(),
                response.vehicleModel(), response.vehicleYear(), response.repairOrderId(),
                response.mechanicNotes(), issues, response.status(),
                response.discountPercentage(), response.taxPercentage(), response.total(),
                response.services(), response.products(),
                response.createdAt(), response.updatedAt()
        );
    }
}
```

---

### 4.8 Controller — `EstimateController`

Base path: `/api/estimates`

```java
@RestController
@RequestMapping("/api/estimates")
@RequiredArgsConstructor
public class EstimateController {

    private final EstimateService estimateService;

    // GET /api/estimates?clientName={}&plate={}&status={}&page=0&size=12&sort=createdAt,desc
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EstimateResponse>>> getAll(
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) EstimateStatus status,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (clientName != null || plate != null || status != null) {
            return ResponseEntity.ok(ApiResponse.success(estimateService.search(clientName, plate, status, pageable)));
        }
        return ResponseEntity.ok(ApiResponse.success(estimateService.getAll(pageable)));
    }

    // GET /api/estimates/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.getById(id)));
    }

    // POST /api/estimates
    @PostMapping
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> create(
            @Valid @RequestBody EstimateRequest request) {
        EstimateDetailResponse created = estimateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Presupuesto creado", created));
    }

    // PUT /api/estimates/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EstimateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto actualizado", estimateService.update(id, request)));
    }

    // PUT /api/estimates/{id}/approve
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto aceptado", estimateService.approve(id)));
    }

    // PUT /api/estimates/{id}/reject
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto rechazado", estimateService.reject(id)));
    }

    // DELETE /api/estimates/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        estimateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Presupuesto eliminado", null));
    }

    // GET /api/estimates/{id}/invoice-data
    @GetMapping("/{id}/invoice-data")
    public ResponseEntity<ApiResponse<EstimateInvoiceDataResponse>> getInvoiceData(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.convertToInvoiceData(id)));
    }
}
```

### 4.9 Repair Order Integration

Add an endpoint in `RepairOrderController` to access the estimate for a specific repair order:

```
GET /api/repair-orders/{id}/estimate
```

```java
// In RepairOrderController (existing controller, add this endpoint)

@GetMapping("/{id}/estimate")
public ResponseEntity<ApiResponse<EstimateDetailResponse>> getEstimateByRepairOrder(@PathVariable Long id) {
    return ResponseEntity.ok(ApiResponse.success(estimateService.getByRepairOrderId(id)));
}
```

The `RepairOrderService` injects `EstimateService` to coordinate, as per the cross-module orchestration pattern.

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/estimates?clientName=&plate=&status=&page=0&size=12&sort=createdAt,desc` | List/search estimates (paginated, sortable by date) |
| `GET` | `/api/estimates/{id}` | Get estimate detail by ID |
| `POST` | `/api/estimates` | Create new estimate |
| `PUT` | `/api/estimates/{id}` | Update estimate (only if PENDIENTE) |
| `PUT` | `/api/estimates/{id}/approve` | Approve estimate (PENDIENTE → ACEPTADO) |
| `PUT` | `/api/estimates/{id}/reject` | Reject estimate (PENDIENTE → RECHAZADO) |
| `DELETE` | `/api/estimates/{id}` | Delete estimate |
| `GET` | `/api/estimates/{id}/invoice-data` | Get pre-loaded data for invoice creation (only if ACEPTADO) |
| `GET` | `/api/repair-orders/{id}/estimate` | Get estimate linked to a repair order |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   └── estimates.ts
├── features/
│   └── estimates/
│       ├── components/
│       │   ├── EstimateList.tsx
│       │   ├── EstimateDetail.tsx
│       │   ├── ServicesGrid.tsx
│       │   ├── ProductsGrid.tsx
│       │   ├── EstimateSummary.tsx
│       │   └── EstimateTab.tsx
│       └── hooks/
│           ├── useEstimates.ts
│           └── useEstimate.ts
├── pages/
│   ├── EstimatesPage.tsx
│   └── EstimateDetailPage.tsx
└── types/
    └── estimate.ts
```

---

### 5.2 Types (`src/types/estimate.ts`)

```ts
// ---- Estimate Status ----

export type EstimateStatus = "PENDIENTE" | "ACEPTADO" | "RECHAZADO";

// ---- Service Line Item ----

export interface EstimateServiceItemRequest {
  serviceName: string;
  price: number;
}

export interface EstimateServiceItemResponse {
  id: number;
  serviceName: string;
  price: number;
}

// ---- Product Line Item ----

export interface EstimateProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface EstimateProductResponse {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ---- Estimate ----

export interface EstimateRequest {
  clientId: number;
  vehicleId: number;
  repairOrderId: number | null;
  discountPercentage: number;
  taxPercentage: number;
  services: EstimateServiceItemRequest[];
  products: EstimateProductRequest[];
}

// List view row
export interface EstimateResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleModel: string;
  repairOrderId: number | null;
  status: EstimateStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  createdAt: string;
  updatedAt: string;
}

// Detail view
export interface EstimateDetailResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  clientDni: string | null;
  clientPhone: string;
  clientEmail: string | null;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  repairOrderId: number | null;
  mechanicNotes: string | null;
  inspectionIssues: InspectionIssueResponse[];
  status: EstimateStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  services: EstimateServiceItemResponse[];
  products: EstimateProductResponse[];
  createdAt: string;
  updatedAt: string;
}

// Inspection issues from repair order inspections
export interface InspectionIssueResponse {
  inspectionItemId: number;
  itemName: string;
  status: string; // "PROBLEMA" | "REVISAR"
  comment: string | null;
}

// Pre-loaded data for invoice creation
export interface EstimateInvoiceDataResponse {
  estimateId: number;
  clientId: number;
  vehicleId: number;
  repairOrderId: number | null;
  services: EstimateServiceItemResponse[];
  products: EstimateProductResponse[];
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
}
```

---

### 5.3 API Layer (`src/api/estimates.ts`)

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Page } from "@/types/pagination";
import type {
  EstimateResponse,
  EstimateDetailResponse,
  EstimateRequest,
  EstimateInvoiceDataResponse,
  EstimateStatus,
} from "@/types/estimate";

export const estimatesApi = {
  getAll: (params: {
    clientName?: string;
    plate?: string;
    status?: EstimateStatus;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    apiClient.get<ApiResponse<Page<EstimateResponse>>>("/estimates", {
      params: {
        clientName: params.clientName,
        plate: params.plate,
        status: params.status,
        page: params.page ?? 0,
        size: params.size ?? 12,
        sort: params.sort ?? "createdAt,desc",
      },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<EstimateDetailResponse>>(`/estimates/${id}`),

  getByRepairOrderId: (repairOrderId: number) =>
    apiClient.get<ApiResponse<EstimateDetailResponse>>(
      `/repair-orders/${repairOrderId}/estimate`
    ),

  create: (data: EstimateRequest) =>
    apiClient.post<ApiResponse<EstimateDetailResponse>>("/estimates", data),

  update: (id: number, data: EstimateRequest) =>
    apiClient.put<ApiResponse<EstimateDetailResponse>>(`/estimates/${id}`, data),

  approve: (id: number) =>
    apiClient.put<ApiResponse<EstimateDetailResponse>>(`/estimates/${id}/approve`),

  reject: (id: number) =>
    apiClient.put<ApiResponse<EstimateDetailResponse>>(`/estimates/${id}/reject`),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/estimates/${id}`),

  getInvoiceData: (id: number) =>
    apiClient.get<ApiResponse<EstimateInvoiceDataResponse>>(
      `/estimates/${id}/invoice-data`
    ),
};
```

---

### 5.4 Hooks

#### `src/features/estimates/hooks/useEstimates.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { estimatesApi } from "@/api/estimates";
import type { EstimateResponse, EstimateStatus } from "@/types/estimate";

export function useEstimates() {
  const [estimates, setEstimates] = useState<EstimateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [clientName, setClientName] = useState<string | undefined>(undefined);
  const [plate, setPlate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<EstimateStatus | undefined>(undefined);

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await estimatesApi.getAll({
        clientName,
        plate,
        status,
        page,
        size: pageSize,
      });
      setEstimates(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch (err) {
      setError("Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  }, [clientName, plate, status, page, pageSize]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const deleteEstimate = async (id: number) => {
    await estimatesApi.delete(id);
    fetchEstimates();
  };

  return {
    estimates,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    clientName,
    setClientName,
    plate,
    setPlate,
    status,
    setStatus,
    deleteEstimate,
    refetch: fetchEstimates,
  };
}
```

#### `src/features/estimates/hooks/useEstimate.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { estimatesApi } from "@/api/estimates";
import type {
  EstimateDetailResponse,
  EstimateRequest,
} from "@/types/estimate";

export function useEstimate(id?: number, repairOrderId?: number) {
  const [estimate, setEstimate] = useState<EstimateDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimate = useCallback(async () => {
    setLoading(true);
    try {
      if (id) {
        const res = await estimatesApi.getById(id);
        setEstimate(res.data.data);
      } else if (repairOrderId) {
        const res = await estimatesApi.getByRepairOrderId(repairOrderId);
        setEstimate(res.data.data);
      }
    } catch (err) {
      setError("Error al cargar el presupuesto");
    } finally {
      setLoading(false);
    }
  }, [id, repairOrderId]);

  useEffect(() => {
    fetchEstimate();
  }, [fetchEstimate]);

  const createEstimate = async (data: EstimateRequest) => {
    const res = await estimatesApi.create(data);
    setEstimate(res.data.data);
    return res.data.data;
  };

  const updateEstimate = async (estimateId: number, data: EstimateRequest) => {
    const res = await estimatesApi.update(estimateId, data);
    setEstimate(res.data.data);
    return res.data.data;
  };

  const approveEstimate = async (estimateId: number) => {
    const res = await estimatesApi.approve(estimateId);
    setEstimate(res.data.data);
    return res.data.data;
  };

  const rejectEstimate = async (estimateId: number) => {
    const res = await estimatesApi.reject(estimateId);
    setEstimate(res.data.data);
    return res.data.data;
  };

  return {
    estimate,
    loading,
    error,
    createEstimate,
    updateEstimate,
    approveEstimate,
    rejectEstimate,
    refetch: fetchEstimate,
  };
}
```

---

### 5.5 Pages

#### `EstimatesPage` — route: `/presupuestos`

**UI Layout:**
- Page title: **"Presupuestos"**
- Filter bar:
  - `TextField` with placeholder: "Buscar por nombre de cliente..."
  - `TextField` with placeholder: "Buscar por patente..."
  - `Select` for status: Todos, Pendiente, Aceptado, Rechazado
- `Button` "Crear nuevo presupuesto" → navigates to `/presupuestos/nuevo`
- `EstimateList` DataGrid component (see below)

```tsx
// src/pages/EstimatesPage.tsx
export default function EstimatesPage() {
  const {
    estimates, loading, error, totalCount,
    page, setPage, pageSize, setPageSize,
    clientName, setClientName, plate, setPlate,
    status, setStatus, deleteEstimate,
  } = useEstimates();

  const navigate = useNavigate();

  const handleRowClick = (id: number) => navigate(`/presupuestos/${id}`);
  const handleCreate = () => navigate("/presupuestos/nuevo");
  const handleInvoice = (id: number) => navigate(`/facturas/nuevo?estimateId=${id}`);

  return (
    <Box>
      <Typography variant="h4">Presupuestos</Typography>
      <Box /* filter bar */>
        <TextField placeholder="Buscar por nombre de cliente..." onChange={...} />
        <TextField placeholder="Buscar por patente..." onChange={...} />
        <Select value={status} onChange={...}>
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="PENDIENTE">Pendiente</MenuItem>
          <MenuItem value="ACEPTADO">Aceptado</MenuItem>
          <MenuItem value="RECHAZADO">Rechazado</MenuItem>
        </Select>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Crear nuevo presupuesto
        </Button>
      </Box>
      <EstimateList
        rows={estimates}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRowClick={handleRowClick}
        onDelete={deleteEstimate}
        onInvoice={handleInvoice}
      />
    </Box>
  );
}
```

#### `EstimateDetailPage` — route: `/presupuestos/:id` and `/presupuestos/nuevo`

```tsx
// src/pages/EstimateDetailPage.tsx
export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "nuevo";
  const estimateId = isNew ? undefined : Number(id);

  // Uses useEstimate hook to fetch existing or start with empty state
  // Renders the EstimateDetail component
  return <EstimateDetail estimateId={estimateId} />;
}
```

---

### 5.6 Components

#### `EstimateList` (`src/features/estimates/components/EstimateList.tsx`)

Uses MUI `DataGrid` from `@mui/x-data-grid`.

```tsx
interface EstimateListProps {
  rows: EstimateResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (id: number) => void;
  onDelete: (id: number) => void;
  onInvoice: (id: number) => void;
}

export function EstimateList({ ... }: EstimateListProps) {
  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha de creación",
      width: 180,
      valueFormatter: (value) => new Date(value).toLocaleDateString("es-AR"),
    },
    { field: "clientFullName", headerName: "Cliente", flex: 1 },
    { field: "vehiclePlate", headerName: "Patente", width: 120 },
    { field: "vehicleModel", headerName: "Modelo", width: 150 },
    {
      field: "status",
      headerName: "Estado",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === "ACEPTADO" ? "success"
            : params.value === "RECHAZADO" ? "error"
            : "warning"
          }
          size="small"
        />
      ),
    },
    {
      field: "repairOrderId",
      headerName: "Orden de trabajo",
      width: 160,
      valueFormatter: (value) => value != null ? `#${value}` : "—",
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      valueFormatter: (value) => value != null ? `$${Number(value).toFixed(2)}` : "—",
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={(e) => { e.stopPropagation(); onDelete(params.row.id); }} color="error" size="small">
            <DeleteIcon />
          </IconButton>
          <IconButton onClick={(e) => { e.stopPropagation(); onRowClick(params.row.id); }} size="small">
            <VisibilityIcon />
          </IconButton>
          <Tooltip title={params.row.status !== "ACEPTADO" ? "Solo se pueden facturar presupuestos aceptados" : "Facturar"}>
            <span>
              <IconButton
                onClick={(e) => { e.stopPropagation(); onInvoice(params.row.id); }}
                size="small"
                disabled={params.row.status !== "ACEPTADO"}
                color="primary"
              >
                <ReceiptIcon />
              </IconButton>
            </span>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      rowCount={totalCount}
      paginationMode="server"
      sortingMode="server"
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={(model) => {
        onPageChange(model.page);
        onPageSizeChange(model.pageSize);
      }}
      pageSizeOptions={[12, 24, 48]}
      onRowClick={(params) => onRowClick(params.row.id)}
    />
  );
}
```

#### `EstimateDetail` (`src/features/estimates/components/EstimateDetail.tsx`)

The main detail component, used both from `EstimateDetailPage` and `EstimateTab`.

```tsx
interface EstimateDetailProps {
  estimateId?: number;       // undefined = create mode
  repairOrderId?: number;    // set when rendered inside repair order tab
}

export function EstimateDetail({ estimateId, repairOrderId }: EstimateDetailProps) {
  const { estimate, loading, error, createEstimate, updateEstimate, approveEstimate, rejectEstimate } =
    useEstimate(estimateId, repairOrderId);

  // --- Header: Client fields ---
  // Autocomplete for client (dropdown + auto-fill readonly fields: name, dni, phone, email)
  // On client select → clear vehicle, load client's vehicles

  // --- Header: Vehicle fields ---
  // Autocomplete for vehicle (cascading from selected client — dropdown + auto-fill readonly: plate, brand, model)

  // --- Creation date (readonly, from system) ---
  // TextField readonly showing estimate.createdAt or "Nuevo presupuesto"

  // --- Mechanic observations (readonly, from repair_orders.mechanic_notes) ---
  // Only shown when repairOrderId is set. TextField multiline, readonly.

  // --- Inspection issues grid (readonly, from backend) ---
  // Only shown when repairOrderId is set.
  // DataGrid with 2 columns: Item (itemName + status chip), Comment

  // --- ServicesGrid ---
  // <ServicesGrid services={...} onChange={...} />

  // --- ProductsGrid ---
  // <ProductsGrid products={...} onChange={...} />

  // --- EstimateSummary ---
  // <EstimateSummary ... />

  // --- Action buttons ---
  // Button "Guardar" → create or update
  // Button "Imprimir / Descargar" → window.print() or PDF generation
  // Button "Enviar presupuesto" → future email integration
  // Button "Aprobar" (only if PENDIENTE) → approve
  // Button "Rechazar" (only if PENDIENTE) → reject

  return ( /* ... */ );
}
```

**Header — Client/Vehicle Autocomplete Pattern:**
- `Autocomplete` for client: fetches `/api/clients?query=...` as the user types.
- On client selection: auto-fills readonly `TextField` fields for name, DNI, phone, email. Clears vehicle selection. Fetches `/api/vehicles?clientId=...` for the vehicle dropdown.
- `Autocomplete` for vehicle (cascading): disabled until a client is selected. Fetches vehicles for the selected client.
- On vehicle selection: auto-fills readonly `TextField` fields for plate, brand, model.
- If client changes after a vehicle is already selected: vehicle selection and its fields are cleared.

#### `ServicesGrid` (`src/features/estimates/components/ServicesGrid.tsx`)

```tsx
interface ServicesGridProps {
  services: EstimateServiceItemRequest[];
  onChange: (services: EstimateServiceItemRequest[]) => void;
  readonly?: boolean;
}

export function ServicesGrid({ services, onChange, readonly = false }: ServicesGridProps) {
  // Button "Agregar servicio" → appends empty row { serviceName: "", price: 0 }
  // Each row:
  //   Column 1: Autocomplete for serviceName
  //     - Fetches /api/services?query=... as user types
  //     - On select from catalog: sets serviceName and price from catalog item (snapshot)
  //     - User can also type a custom service name
  //   Column 2: TextField for price (numeric)
  //   Delete button per row

  // Below grid: Subtotal (sum of all service prices)
  // "Subtotal servicios: $X.XX"

  return (
    <Box>
      <Typography variant="h6">Servicios</Typography>
      {services.map((svc, index) => (
        <Box key={index} /* row layout */>
          <Autocomplete
            freeSolo
            options={catalogServices}
            getOptionLabel={(option) => typeof option === "string" ? option : option.name}
            inputValue={svc.serviceName}
            onInputChange={(_, value) => updateServiceName(index, value)}
            onChange={(_, value) => {
              if (value && typeof value !== "string") {
                updateService(index, { serviceName: value.name, price: value.price ?? 0 });
              }
            }}
            renderInput={(params) => <TextField {...params} label="Servicio" />}
            disabled={readonly}
          />
          <TextField
            type="number"
            label="Precio"
            value={svc.price}
            onChange={(e) => updateServicePrice(index, Number(e.target.value))}
            disabled={readonly}
          />
          {!readonly && (
            <IconButton onClick={() => removeService(index)} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      {!readonly && (
        <Button onClick={addService} startIcon={<AddIcon />}>Agregar servicio</Button>
      )}
      <Typography variant="subtitle1">
        Subtotal servicios: ${servicesSubtotal.toFixed(2)}
      </Typography>
    </Box>
  );
}
```

#### `ProductsGrid` (`src/features/estimates/components/ProductsGrid.tsx`)

```tsx
interface ProductsGridProps {
  products: EstimateProductRequest[];
  onChange: (products: EstimateProductRequest[]) => void;
  readonly?: boolean;
}

export function ProductsGrid({ products, onChange, readonly = false }: ProductsGridProps) {
  // Button "Agregar producto" → appends empty row { productName: "", quantity: 1, unitPrice: 0 }
  // Each row:
  //   Column 1: Autocomplete for productName
  //     - Fetches /api/products?query=... as user types
  //     - On select from catalog: sets productName and unitPrice from catalog item (snapshot)
  //     - User can also type a custom product name
  //   Column 2: TextField for quantity (integer)
  //   Column 3: TextField for unitPrice (numeric)
  //   Column 4: Computed totalPrice = quantity * unitPrice (readonly display)
  //   Delete button per row

  // Below grid: Subtotal (sum of all product totalPrices)
  // "Subtotal productos: $X.XX"

  return (
    <Box>
      <Typography variant="h6">Productos</Typography>
      {products.map((prod, index) => (
        <Box key={index} /* row layout */>
          <Autocomplete
            freeSolo
            options={catalogProducts}
            getOptionLabel={(option) => typeof option === "string" ? option : option.name}
            inputValue={prod.productName}
            onInputChange={(_, value) => updateProductName(index, value)}
            onChange={(_, value) => {
              if (value && typeof value !== "string") {
                updateProduct(index, {
                  productName: value.name,
                  quantity: prod.quantity,
                  unitPrice: value.unitPrice ?? 0,
                });
              }
            }}
            renderInput={(params) => <TextField {...params} label="Producto" />}
            disabled={readonly}
          />
          <TextField
            type="number"
            label="Cantidad"
            value={prod.quantity}
            onChange={(e) => updateProductQuantity(index, Number(e.target.value))}
            disabled={readonly}
          />
          <TextField
            type="number"
            label="Precio unitario"
            value={prod.unitPrice}
            onChange={(e) => updateProductUnitPrice(index, Number(e.target.value))}
            disabled={readonly}
          />
          <TextField
            label="Precio total"
            value={(prod.quantity * prod.unitPrice).toFixed(2)}
            InputProps={{ readOnly: true, startAdornment: "$" }}
          />
          {!readonly && (
            <IconButton onClick={() => removeProduct(index)} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      {!readonly && (
        <Button onClick={addProduct} startIcon={<AddIcon />}>Agregar producto</Button>
      )}
      <Typography variant="subtitle1">
        Subtotal productos: ${productsSubtotal.toFixed(2)}
      </Typography>
    </Box>
  );
}
```

#### `EstimateSummary` (`src/features/estimates/components/EstimateSummary.tsx`)

```tsx
interface EstimateSummaryProps {
  servicesSubtotal: number;
  productsSubtotal: number;
  discountPercentage: number;
  taxPercentage: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  readonly?: boolean;
}

export function EstimateSummary({
  servicesSubtotal,
  productsSubtotal,
  discountPercentage,
  taxPercentage,
  onDiscountChange,
  onTaxChange,
  readonly = false,
}: EstimateSummaryProps) {
  const subtotal = servicesSubtotal + productsSubtotal;
  const discountAmount = subtotal * (discountPercentage / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercentage / 100);
  const finalPrice = afterDiscount + taxAmount;

  return (
    <Box>
      <Typography variant="h6">Resumen</Typography>
      <Box /* summary layout */>
        <Typography>Total (servicios + productos): ${subtotal.toFixed(2)}</Typography>
        <TextField
          type="number"
          label="Descuento (%)"
          value={discountPercentage}
          onChange={(e) => {
            const val = Math.min(100, Math.max(0, Number(e.target.value)));
            onDiscountChange(val);
          }}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          inputProps={{ min: 0, max: 100 }}
          disabled={readonly}
        />
        <TextField
          type="number"
          label="Impuesto (%)"
          value={taxPercentage}
          onChange={(e) => {
            const val = Math.min(100, Math.max(0, Number(e.target.value)));
            onTaxChange(val);
          }}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          inputProps={{ min: 0, max: 100 }}
          disabled={readonly}
        />
        <Typography variant="h6">Precio final: ${finalPrice.toFixed(2)}</Typography>
      </Box>
    </Box>
  );
}
```

#### `EstimateTab` (`src/features/estimates/components/EstimateTab.tsx`)

This component replaces the "Presupuesto" tab placeholder in the repair order detail view (from spec 06).

```tsx
interface EstimateTabProps {
  repairOrderId: number;
}

export function EstimateTab({ repairOrderId }: EstimateTabProps) {
  // Reuses the EstimateDetail component, passing repairOrderId
  // If no estimate exists for this repair order, shows a "Crear presupuesto" button
  // Client and vehicle are pre-filled from the repair order data (readonly)

  return (
    <Box>
      <EstimateDetail repairOrderId={repairOrderId} />
    </Box>
  );
}
```

---

### 5.7 Routes

Add to `src/routes/`:

```tsx
{ path: "/presupuestos", element: <EstimatesPage /> }
{ path: "/presupuestos/:id", element: <EstimateDetailPage /> }
```

Use `React.lazy` for page-level components:

```tsx
const EstimatesPage = lazy(() => import("@/pages/EstimatesPage"));
const EstimateDetailPage = lazy(() => import("@/pages/EstimateDetailPage"));
```

---

## 6. Business Rules

| # | Rule | Implementation |
|---|---|---|
| 1 | **Snapshot line items** | `estimate_services.service_name` and `estimate_products.product_name` store plain strings (not FK references). When a service/product is selected from the catalog autocomplete, its name and price are **copied by value** at creation time. Later changes to the catalog item do not retroactively affect existing estimates. |
| 2 | **Status workflow is one-way** | An estimate starts as `PENDIENTE`. It can transition to `ACEPTADO` or `RECHAZADO`, but **never back** to `PENDIENTE` or from `ACEPTADO` to `RECHAZADO` (or vice versa). Enforced in `EstimateServiceImpl.approve()` and `reject()` which check `status == PENDIENTE`. |
| 3 | **Only PENDIENTE estimates can be edited** | `update()` throws `BusinessRuleException` if `status != PENDIENTE`. |
| 4 | **Discount and tax validation** | Both `discount_percentage` and `tax_percentage` must be between 0 and 100 (inclusive). Enforced by DB CHECK constraints and DTO `@DecimalMin`/`@DecimalMax` annotations. |
| 5 | **Total calculation** | `total = (servicesSum + productsSum) - discount + tax`. Where: `servicesSum = sum of all service prices`, `productsSum = sum of (quantity × unitPrice) for all products`, `discount = subtotal × discountPercentage / 100`, `tax = (subtotal - discount) × taxPercentage / 100`. Computed server-side on create/update. |
| 6 | **Product total_price** | `estimate_products.total_price = quantity × unit_price`. Computed server-side on create/update. |
| 7 | **Children replaced on update** | When updating an estimate, the entire list of services and products is replaced (clear + re-add). No partial updates on child entities. JPA `orphanRemoval = true` + DB `ON DELETE CASCADE`. |
| 8 | **Conversion to invoice** | The `convertToInvoiceData()` method returns a `EstimateInvoiceDataResponse` with all line items and pricing data, ready to pre-populate the invoice creation screen. Only available for `ACEPTADO` estimates. The "Facturar" button in the list navigates to `/facturas/nuevo?estimateId={id}`. |
| 9 | **Inspection issues** | When an estimate belongs to a repair order, the detail view shows: (a) `mechanic_notes` from the repair order (readonly), and (b) all inspection items with `PROBLEMA` or `REVISAR` status from the repair order's inspections (readonly). Fetched via `getInspectionIssues(repairOrderId)`. |
| 10 | **Client/vehicle from repair order** | When creating an estimate from the "Presupuesto" tab in a repair order, the `clientId` and `vehicleId` are pre-filled from the repair order and the corresponding header fields are readonly. |
| 11 | **Pagination** | Default page size is 12 rows. Server-side pagination and sorting (default sort: `createdAt,desc`). |
| 12 | **Delete cascade** | Deleting an estimate cascades to its `estimate_services` and `estimate_products` (DB-level `ON DELETE CASCADE` + JPA `orphanRemoval = true`). |
| 13 | **One estimate per repair order** | A repair order can have at most one estimate linked via `repair_order_id`. The `getByRepairOrderId()` method returns a single result. |

---

## 7. Testing

### 7.1 Backend — Unit Tests

#### Service layer tests (JUnit 5 + Mockito)

| Test Class | Test Methods |
|---|---|
| `EstimateServiceImplTest` | `getAll_returnsPage()`, `search_withFilters_returnsFilteredPage()`, `getById_existingId_returnsDetailResponse()`, `getById_nonExistingId_throwsResourceNotFoundException()`, `getByRepairOrderId_existingId_returnsDetailResponse()`, `getByRepairOrderId_nonExistingId_throwsResourceNotFoundException()`, `create_validRequest_returnsDetailResponse()`, `create_withRepairOrder_setsRepairOrderRelation()`, `create_withServicesAndProducts_savesChildren()`, `create_calculatesTotal_correctly()`, `update_existingPendienteEstimate_returnsUpdatedResponse()`, `update_nonPendienteEstimate_throwsBusinessRuleException()`, `update_nonExistingId_throwsResourceNotFoundException()`, `update_replacesChildren()`, `approve_pendienteEstimate_setsStatusAceptado()`, `approve_nonPendienteEstimate_throwsBusinessRuleException()`, `reject_pendienteEstimate_setsStatusRechazado()`, `reject_nonPendienteEstimate_throwsBusinessRuleException()`, `delete_existingId_deletesSuccessfully()`, `delete_nonExistingId_throwsResourceNotFoundException()`, `calculateTotal_withServicesAndProducts_returnsCorrectTotal()`, `calculateTotal_withDiscount_appliesDiscount()`, `calculateTotal_withTax_appliesTax()`, `calculateTotal_withDiscountAndTax_appliesBoth()`, `convertToInvoiceData_aceptadoEstimate_returnsData()`, `convertToInvoiceData_nonAceptadoEstimate_throwsBusinessRuleException()`, `getInspectionIssues_returnsProblemaAndRevisarItems()` |

#### Controller layer tests (MockMvc + `@WebMvcTest`)

| Test Class | Test Methods |
|---|---|
| `EstimateControllerTest` | `getAll_returns200()`, `getAll_withFilters_returns200()`, `getById_returns200()`, `getById_notFound_returns404()`, `create_validRequest_returns201()`, `create_invalidRequest_returns400()`, `update_returns200()`, `update_notFound_returns404()`, `approve_returns200()`, `reject_returns200()`, `delete_returns200()`, `delete_notFound_returns404()`, `getInvoiceData_returns200()` |

#### Mapper tests

| Test Class | Test Methods |
|---|---|
| `EstimateMapperTest` | `toResponse_mapsAllFields()`, `toDetailResponse_mapsAllFieldsIncludingClientAndVehicle()`, `toServiceItemResponse_mapsAllFields()`, `toProductResponse_mapsAllFields()`, `toEntity_ignoresChildCollections()`, `toInvoiceDataResponse_mapsAllFields()` |

### 7.2 Frontend — Unit Tests (Vitest + React Testing Library)

| Test File | What it covers |
|---|---|
| `EstimateList.test.tsx` | Renders columns correctly (date, client, plate, model, status chip, repair order, total, actions), shows loading state, calls `onRowClick`, calls `onDelete`, "Facturar" button enabled only for ACEPTADO rows, calls `onInvoice`, pagination controls work |
| `EstimateDetail.test.tsx` | Renders client/vehicle header fields, client autocomplete triggers vehicle refresh, vehicle autocomplete auto-fills readonly fields, shows mechanic notes (readonly) when from repair order, shows inspection issues grid when from repair order, save button calls create/update API, approve/reject buttons work for PENDIENTE status |
| `ServicesGrid.test.tsx` | Renders service rows, "Agregar servicio" adds empty row, autocomplete suggests catalog services, selecting catalog service sets name and price (snapshot), deleting a row removes it, subtotal calculates correctly, readonly mode disables editing |
| `ProductsGrid.test.tsx` | Renders product rows, "Agregar producto" adds empty row, autocomplete suggests catalog products, selecting catalog product sets name and unitPrice (snapshot), quantity × unitPrice = totalPrice, deleting a row removes it, subtotal calculates correctly, readonly mode disables editing |
| `EstimateSummary.test.tsx` | Displays subtotal correctly, discount field clamped 0–100, tax field clamped 0–100, final price calculated correctly, readonly mode disables editing |
| `EstimateTab.test.tsx` | Renders inside repair order detail, shows "Crear presupuesto" if none exists, loads existing estimate for repair order, client/vehicle fields are pre-filled and readonly |
| `useEstimates.test.ts` | Fetches data on mount, handles filter changes (clientName, plate, status), pagination changes trigger refetch, delete triggers refetch |
| `useEstimate.test.ts` | Fetches by id, fetches by repairOrderId, create/update/approve/reject trigger state update, handles loading/error states |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend

- [ ] Create `EstimateStatus` enum (`PENDIENTE`, `ACEPTADO`, `RECHAZADO`)
- [ ] Create `Estimate` entity (relationships: `Client`, `Vehicle`, `RepairOrder`, `EstimateServiceItem`, `EstimateProduct`)
- [ ] Create `EstimateServiceItem` entity (relationship: `Estimate`)
- [ ] Create `EstimateProduct` entity (relationship: `Estimate`)
- [ ] Create `EstimateRepository` with methods: `findWithDetailsById`, `findByRepairOrderId`, `findAllByRepairOrderId`, `search` (custom JPQL query)
- [ ] Create `EstimateServiceItemRepository` with methods: `findByEstimateId`, `deleteByEstimateId`
- [ ] Create `EstimateProductRepository` with methods: `findByEstimateId`, `deleteByEstimateId`
- [ ] Create `EstimateRequest` record with Jakarta Validation annotations (`@NotNull`, `@DecimalMin`, `@DecimalMax`, `@Digits`, `@Valid`)
- [ ] Create `EstimateServiceItemRequest` record with Jakarta Validation annotations (`@NotBlank`, `@Size`, `@NotNull`, `@DecimalMin`, `@Digits`)
- [ ] Create `EstimateProductRequest` record with Jakarta Validation annotations (`@NotBlank`, `@Size`, `@NotNull`, `@Min`, `@DecimalMin`, `@Digits`)
- [ ] Create `EstimateResponse` record (list view DTO)
- [ ] Create `EstimateDetailResponse` record (detail view DTO with client/vehicle/inspection data)
- [ ] Create `EstimateServiceItemResponse` record
- [ ] Create `EstimateProductResponse` record
- [ ] Create `InspectionIssueResponse` record
- [ ] Create `EstimateInvoiceDataResponse` record
- [ ] Create `EstimateMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md)
  - [ ] `toResponse(Estimate)` → `EstimateResponse`
  - [ ] `toDetailResponse(Estimate)` → `EstimateDetailResponse`
  - [ ] `toServiceItemResponse(EstimateServiceItem)` → `EstimateServiceItemResponse`
  - [ ] `toProductResponse(EstimateProduct)` → `EstimateProductResponse`
  - [ ] `toEntity(EstimateRequest)` → `Estimate`
  - [ ] `toInvoiceDataResponse(Estimate)` → `EstimateInvoiceDataResponse`
- [ ] Create `EstimateService` interface
- [ ] Create `EstimateServiceImpl` implementation
  - [ ] `getAll(Pageable)` — paginated list of all estimates
  - [ ] `search(clientName, plate, status, Pageable)` — filtered search
  - [ ] `getById(Long)` — detail with inspection issues
  - [ ] `getByRepairOrderId(Long)` — detail for repair order's estimate
  - [ ] `create(EstimateRequest)` — create estimate with children, calculate total
  - [ ] `update(Long, EstimateRequest)` — update only PENDIENTE, replace children, recalculate total
  - [ ] `approve(Long)` — PENDIENTE → ACEPTADO
  - [ ] `reject(Long)` — PENDIENTE → RECHAZADO
  - [ ] `delete(Long)` — delete estimate
  - [ ] `calculateTotal(services, products, discount, tax)` — total calculation logic
  - [ ] `convertToInvoiceData(Long)` — return invoice pre-load data (only ACEPTADO)
  - [ ] `getInspectionIssues(Long)` — fetch PROBLEMA/REVISAR items from inspections
- [ ] Create `EstimateController` with all endpoints:
  - [ ] `GET /api/estimates` — list/search (paginated)
  - [ ] `GET /api/estimates/{id}` — get by ID
  - [ ] `POST /api/estimates` — create
  - [ ] `PUT /api/estimates/{id}` — update
  - [ ] `PUT /api/estimates/{id}/approve` — approve
  - [ ] `PUT /api/estimates/{id}/reject` — reject
  - [ ] `DELETE /api/estimates/{id}` — delete
  - [ ] `GET /api/estimates/{id}/invoice-data` — invoice pre-load data
- [ ] Add `GET /api/repair-orders/{id}/estimate` endpoint in `RepairOrderController`
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [ ] Create types file `src/types/estimate.ts` (`EstimateStatus`, `EstimateServiceItemRequest`, `EstimateServiceItemResponse`, `EstimateProductRequest`, `EstimateProductResponse`, `EstimateRequest`, `EstimateResponse`, `EstimateDetailResponse`, `InspectionIssueResponse`, `EstimateInvoiceDataResponse`)
- [ ] Create API layer `src/api/estimates.ts` (all estimate API methods)
- [ ] Create `useEstimates` hook — list with pagination, filtering, delete
- [ ] Create `useEstimate` hook — single estimate CRUD operations
- [ ] Create `EstimatesPage` — route `/presupuestos` with filters and DataGrid
- [ ] Create `EstimateDetailPage` — route `/presupuestos/:id` and `/presupuestos/nuevo`
- [ ] Create `EstimateList` component — DataGrid with columns (date, client, plate, model, status chip, repair order, total, actions with delete/view/facturar)
- [ ] Create `EstimateDetail` component — main detail form with client/vehicle autocomplete, mechanic notes, inspection issues, services/products grids, summary, action buttons
- [ ] Create `ServicesGrid` component — editable services grid with catalog autocomplete, add/remove rows, subtotal
- [ ] Create `ProductsGrid` component — editable products grid with catalog autocomplete, quantity, unit price, total price, add/remove rows, subtotal
- [ ] Create `EstimateSummary` component — discount %, tax %, final price calculation
- [ ] Create `EstimateTab` component — for repair order detail "Presupuesto" tab
- [ ] Register routes with lazy loading (`/presupuestos`, `/presupuestos/:id`)
- [ ] Verify frontend compiles
- [ ] Verify frontend runs

### 8.3 Business Rules Verification

- [ ] Snapshot line items: service/product names and prices are copied by value at creation, not FK references
- [ ] Status workflow is one-way: PENDIENTE → ACEPTADO or RECHAZADO only, never back
- [ ] Only PENDIENTE estimates can be edited (update throws BusinessRuleException otherwise)
- [ ] Discount and tax percentages validated between 0 and 100
- [ ] Total calculation: `(servicesSum + productsSum) - discount + tax` with HALF_UP rounding
- [ ] Product total_price = quantity × unit_price computed server-side
- [ ] Children replaced on update (clear + re-add, orphanRemoval = true)
- [ ] Conversion to invoice only available for ACEPTADO estimates
- [ ] Inspection issues (PROBLEMA/REVISAR) shown when estimate belongs to repair order
- [ ] Client/vehicle pre-filled and readonly when creating from repair order tab
- [ ] Pagination defaults: page size 12, sort by createdAt desc
- [ ] Delete cascades to estimate_services and estimate_products
- [ ] One estimate per repair order enforced

### 8.4 Testing

- [ ] `EstimateServiceImplTest` — all service layer test methods
- [ ] `EstimateControllerTest` — all controller layer test methods
- [ ] `EstimateMapperTest` — all mapper test methods
- [ ] `EstimateList.test.tsx` — grid rendering, actions, pagination
- [ ] `EstimateDetail.test.tsx` — form rendering, client/vehicle autocomplete, mechanic notes, inspection issues, save/approve/reject
- [ ] `ServicesGrid.test.tsx` — add/remove rows, catalog autocomplete, subtotal, readonly mode
- [ ] `ProductsGrid.test.tsx` — add/remove rows, catalog autocomplete, quantity × price, subtotal, readonly mode
- [ ] `EstimateSummary.test.tsx` — subtotal, discount/tax clamping, final price, readonly mode
- [ ] `EstimateTab.test.tsx` — renders inside repair order, create/load behavior
- [ ] `useEstimates.test.ts` — fetching, filtering, pagination, delete
- [ ] `useEstimate.test.ts` — fetch by id/repairOrderId, CRUD operations, loading/error states
