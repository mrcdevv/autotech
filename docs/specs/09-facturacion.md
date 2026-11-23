# 09 — Remitos (Delivery Notes)

## 1. Overview

This feature implements full management for **Delivery Notes (Remitos)** — documents that record the billing for services and products provided to a client's vehicle. Remitos can be created as **standalone** (from the `/remitos` list), **within a repair order** (from the "Remito" tab in repair order detail, replacing the placeholder from spec 06), or **pre-loaded from an approved estimate** (via the "remitir" action in spec 08).

Key capabilities:
- Create delivery notes with nested line items (services and products), snapshotted at creation time.
- Status workflow: `PENDIENTE` → `PAGADA` (auto-transitions when total payments equal the delivery note total; see spec 10 for payment details).
- **Immutable after creation**: once a delivery note is created, its data (client, vehicle, line items, discount, tax, total) cannot be edited.
- Integration with the **Services** and **Products** catalogs via autocomplete (names and prices are **snapshotted** — copied by value at creation time, not FK references).
- "Remito anónimo" support: for **TEMPORAL** clients, only products are allowed (no services). The client must exist in the system (created with type `TEMPORAL` — name + phone only).
- Pre-loading from an **ACEPTADO** estimate: copies client, vehicle, repair order, services, products, discount, and tax into the delivery note creation form.
- Download / print delivery note.
- Summary calculation: subtotals for services and products, discount %, tax %, and final price.
- Two-tab detail view: **Datos del Remito** (delivery note data) and **Pagos** (payments, handled by spec 10).

**Dependencies**: Clients (spec 02), Vehicles (spec 03), Services & Products catalog (spec 04), Repair Orders (spec 06), Estimates (spec 08), Payments (spec 10).

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/delivery-notes` |
| Base | `develop` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add DeliveryNote, DeliveryNoteServiceItem, DeliveryNoteProduct entities`
- `feat: add delivery note CRUD endpoints`
- `feat: add DeliveryNotesPage with DataGrid`
- `feat: add DeliveryNoteDetailPage with delivery note data and payments tabs`
- `feat: add DeliveryNoteTab component for repair order detail`
- `feat: add createFromEstimate pre-loading logic`
- `feat: add TEMPORAL client restriction (products only)`
- `test: add unit tests for DeliveryNoteService`

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. No new migration needed.

### 3.1 `delivery_notes`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `client_id` | `BIGINT` | NOT NULL, FK → `clients(id)` |
| `vehicle_id` | `BIGINT` | FK → `vehicles(id)`, nullable |
| `repair_order_id` | `BIGINT` | FK → `repair_orders(id)`, nullable |
| `estimate_id` | `BIGINT` | FK → `estimates(id)`, nullable |
| `discount_percentage` | `NUMERIC(5,2)` | NOT NULL, DEFAULT 0, CHECK (0–100) |
| `tax_percentage` | `NUMERIC(5,2)` | NOT NULL, DEFAULT 0, CHECK (0–100) |
| `total` | `NUMERIC(12,2)` | nullable (computed on save) |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'PENDIENTE'`, CHECK (`PENDIENTE`, `PAGADA`) |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Indexes**: `idx_delivery_notes_client_id`, `idx_delivery_notes_repair_order_id`.

### 3.2 `delivery_note_services`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `delivery_note_id` | `BIGINT` | NOT NULL, FK → `delivery_notes(id)` ON DELETE CASCADE |
| `service_name` | `VARCHAR(255)` | NOT NULL |
| `price` | `NUMERIC(12,2)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_delivery_note_services_delivery_note_id`.

### 3.3 `delivery_note_products`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `delivery_note_id` | `BIGINT` | NOT NULL, FK → `delivery_notes(id)` ON DELETE CASCADE |
| `product_name` | `VARCHAR(255)` | NOT NULL |
| `quantity` | `INTEGER` | NOT NULL |
| `unit_price` | `NUMERIC(12,2)` | NOT NULL |
| `total_price` | `NUMERIC(12,2)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_delivery_note_products_delivery_note_id`.

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.deliverynote/
├── controller/
│   └── DeliveryNoteController.java
├── service/
│   ├── DeliveryNoteService.java               (interface)
│   └── DeliveryNoteServiceImpl.java           (implementation)
├── repository/
│   ├── DeliveryNoteRepository.java
│   ├── DeliveryNoteServiceItemRepository.java
│   └── DeliveryNoteProductRepository.java
├── model/
│   ├── DeliveryNote.java
│   ├── DeliveryNoteStatus.java                (enum)
│   ├── DeliveryNoteServiceItem.java
│   └── DeliveryNoteProduct.java
└── dto/
    ├── DeliveryNoteRequest.java
    ├── DeliveryNoteServiceItemRequest.java
    ├── DeliveryNoteProductRequest.java
    ├── DeliveryNoteResponse.java
    ├── DeliveryNoteDetailResponse.java
    ├── DeliveryNoteServiceItemResponse.java
    ├── DeliveryNoteProductResponse.java
    └── DeliveryNoteMapper.java
```

> **Naming rationale**: The line-item entity is named `DeliveryNoteServiceItem` (not `DeliveryNoteService`) to avoid clashing with the service-layer interface `DeliveryNoteService`.

---

### 4.2 Enum — `DeliveryNoteStatus`

```java
package com.autotech.deliverynote.model;

public enum DeliveryNoteStatus {
    PENDIENTE,
    PAGADA
}
```

---

### 4.3 Entities

#### `DeliveryNote`

```java
@Entity
@Table(name = "delivery_notes")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class DeliveryNote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_order_id")
    private RepairOrder repairOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estimate_id")
    private Estimate estimate;

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "tax_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @Column(name = "total", precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DeliveryNoteStatus status = DeliveryNoteStatus.PENDIENTE;

    @OneToMany(mappedBy = "deliveryNote", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<DeliveryNoteServiceItem> services = new HashSet<>();

    @OneToMany(mappedBy = "deliveryNote", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<DeliveryNoteProduct> products = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DeliveryNote other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

#### `DeliveryNoteServiceItem`

```java
@Entity
@Table(name = "delivery_note_services")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class DeliveryNoteServiceItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_note_id", nullable = false)
    private DeliveryNote deliveryNote;

    @Column(name = "service_name", nullable = false, length = 255)
    private String serviceName;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DeliveryNoteServiceItem other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

#### `DeliveryNoteProduct`

```java
@Entity
@Table(name = "delivery_note_products")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class DeliveryNoteProduct extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_note_id", nullable = false)
    private DeliveryNote deliveryNote;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DeliveryNoteProduct other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

---

### 4.4 Repositories

#### `DeliveryNoteRepository`

```java
@Repository
public interface DeliveryNoteRepository extends JpaRepository<DeliveryNote, Long> {

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder", "estimate"})
    Optional<DeliveryNote> findWithDetailsById(Long id);

    Optional<DeliveryNote> findByRepairOrderId(Long repairOrderId);

    Optional<DeliveryNote> findByestimateId(Long estimateId);

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder", "estimate"})
    Page<DeliveryNote> findAll(Pageable pageable);

    @Query("""
        SELECT i FROM DeliveryNote i
        LEFT JOIN i.client c
        LEFT JOIN i.vehicle v
        WHERE (:clientName IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :clientName, '%'))
               OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :clientName, '%')))
        AND (:plate IS NULL OR LOWER(v.plate) LIKE LOWER(CONCAT('%', :plate, '%')))
        AND (:status IS NULL OR i.status = :status)
    """)
    Page<DeliveryNote> search(
            @Param("clientName") String clientName,
            @Param("plate") String plate,
            @Param("status") DeliveryNoteStatus status,
            Pageable pageable);
}
```

#### `DeliveryNoteServiceItemRepository`

```java
@Repository
public interface DeliveryNoteServiceItemRepository extends JpaRepository<DeliveryNoteServiceItem, Long> {

    List<DeliveryNoteServiceItem> findByDeliveryNoteId(Long deliveryNoteId);

    void deleteByDeliveryNoteId(Long deliveryNoteId);
}
```

#### `DeliveryNoteProductRepository`

```java
@Repository
public interface DeliveryNoteProductRepository extends JpaRepository<DeliveryNoteProduct, Long> {

    List<DeliveryNoteProduct> findByDeliveryNoteId(Long deliveryNoteId);

    void deleteByDeliveryNoteId(Long deliveryNoteId);
}
```

---

### 4.5 DTOs

#### Request DTOs

```java
public record DeliveryNoteServiceItemRequest(
        @NotBlank(message = "El nombre del servicio es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String serviceName,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "El precio debe tener como máximo 10 dígitos enteros y 2 decimales")
        BigDecimal price
) {}

public record DeliveryNoteProductRequest(
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

public record DeliveryNoteRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long clientId,

        Long vehicleId,            // nullable — not required for TEMPORAL client delivery notes

        Long repairOrderId,        // nullable — only set when creating from a repair order

        Long estimateId,           // nullable — only set when creating from an estimate

        @DecimalMin(value = "0.00", message = "El descuento no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El descuento no puede superar el 100%")
        @Digits(integer = 3, fraction = 2)
        BigDecimal discountPercentage,

        @DecimalMin(value = "0.00", message = "El impuesto no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El impuesto no puede superar el 100%")
        @Digits(integer = 3, fraction = 2)
        BigDecimal taxPercentage,

        @Valid
        List<DeliveryNoteServiceItemRequest> services,

        @Valid
        List<DeliveryNoteProductRequest> products
) {}
```

#### Response DTOs

```java
public record DeliveryNoteServiceItemResponse(
        Long id,
        String serviceName,
        BigDecimal price
) {}

public record DeliveryNoteProductResponse(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}

// Used in the list view (DeliveryNotesPage grid)
public record DeliveryNoteResponse(
        Long id,
        Long clientId,
        String clientFullName,
        Long vehicleId,
        String vehiclePlate,
        String vehicleModel,
        Long repairOrderId,
        Long estimateId,
        DeliveryNoteStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

// Used in the detail view (DeliveryNoteDetailPage / DeliveryNoteTab)
public record DeliveryNoteDetailResponse(
        Long id,
        Long clientId,
        String clientFullName,
        String clientDni,
        String clientPhone,
        String clientEmail,
        String clientType,                      // "PERSONAL", "EMPRESA", or "TEMPORAL"
        Long vehicleId,
        String vehiclePlate,
        String vehicleBrand,
        String vehicleModel,
        Integer vehicleYear,
        Long repairOrderId,
        Long estimateId,
        DeliveryNoteStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        List<DeliveryNoteServiceItemResponse> services,
        List<DeliveryNoteProductResponse> products,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

---

### 4.6 Mapper — `DeliveryNoteMapper`

```java
@Mapper(componentModel = "spring")
public interface DeliveryNoteMapper {

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFullName", expression = "java(entity.getClient().getFirstName() + \" \" + entity.getClient().getLastName())")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehiclePlate", source = "vehicle.plate")
    @Mapping(target = "vehicleModel", source = "vehicle.model")
    @Mapping(target = "repairOrderId", source = "repairOrder.id")
    @Mapping(target = "estimateId", source = "estimate.id")
    DeliveryNoteResponse toResponse(DeliveryNote entity);

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFullName", expression = "java(entity.getClient().getFirstName() + \" \" + entity.getClient().getLastName())")
    @Mapping(target = "clientDni", source = "client.dni")
    @Mapping(target = "clientPhone", source = "client.phone")
    @Mapping(target = "clientEmail", source = "client.email")
    @Mapping(target = "clientType", source = "client.clientType")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehiclePlate", source = "vehicle.plate")
    @Mapping(target = "vehicleBrand", expression = "java(entity.getVehicle() != null && entity.getVehicle().getBrand() != null ? entity.getVehicle().getBrand().getName() : null)")
    @Mapping(target = "vehicleModel", source = "vehicle.model")
    @Mapping(target = "vehicleYear", source = "vehicle.year")
    @Mapping(target = "repairOrderId", source = "repairOrder.id")
    @Mapping(target = "estimateId", source = "estimate.id")
    DeliveryNoteDetailResponse toDetailResponse(DeliveryNote entity);

    DeliveryNoteServiceItemResponse toServiceItemResponse(DeliveryNoteServiceItem entity);

    DeliveryNoteProductResponse toProductResponse(DeliveryNoteProduct entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "client", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    @Mapping(target = "repairOrder", ignore = true)
    @Mapping(target = "estimate", ignore = true)
    @Mapping(target = "services", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "total", ignore = true)
    DeliveryNote toEntity(DeliveryNoteRequest request);
}
```

---

### 4.7 Service — `DeliveryNoteService`

#### Interface

```java
public interface DeliveryNoteService {

    Page<DeliveryNoteResponse> getAll(Pageable pageable);

    Page<DeliveryNoteResponse> search(String clientName, String plate, DeliveryNoteStatus status, Pageable pageable);

    DeliveryNoteDetailResponse getById(Long id);

    DeliveryNoteDetailResponse getByRepairOrderId(Long repairOrderId);

    DeliveryNoteDetailResponse create(DeliveryNoteRequest request);

    DeliveryNoteDetailResponse createFromEstimate(Long estimateId);

    void delete(Long id);

    BigDecimal calculateTotal(List<DeliveryNoteServiceItemRequest> services,
                              List<DeliveryNoteProductRequest> products,
                              BigDecimal discountPercentage,
                              BigDecimal taxPercentage);

    void markAsPaid(Long id);
}
```

#### Implementation — `DeliveryNoteServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryNoteServiceImpl implements DeliveryNoteService {

    private final DeliveryNoteRepository deliveryNoteRepository;
    private final DeliveryNoteMapper deliveryNoteMapper;
    private final ClientRepository clientRepository;           // from client module
    private final VehicleRepository vehicleRepository;         // from vehicle module
    private final RepairOrderRepository repairOrderRepository; // from repairorder module
    private final EstimateService estimateService;             // from estimate module (interface)

    @Override
    @Transactional(readOnly = true)
        public Page<DeliveryNoteResponse> getAll(Pageable pageable) {
            log.debug("Fetching all delivery notes");
            return deliveryNoteRepository.findAll(pageable)
                    .map(deliveryNoteMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
        public Page<DeliveryNoteResponse> search(String clientName, String plate, DeliveryNoteStatus status, Pageable pageable) {
            log.debug("Searching delivery notes - clientName: '{}', plate: '{}', status: '{}'", clientName, plate, status);
            return deliveryNoteRepository.search(clientName, plate, status, pageable)
                    .map(deliveryNoteMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
        public DeliveryNoteDetailResponse getById(Long id) {
            log.debug("Fetching delivery note with id {}", id);
            DeliveryNote entity = deliveryNoteRepository.findWithDetailsById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));
            return deliveryNoteMapper.toDetailResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
        public DeliveryNoteDetailResponse getByRepairOrderId(Long repairOrderId) {
            log.debug("Fetching delivery note for repair order {}", repairOrderId);
            DeliveryNote entity = deliveryNoteRepository.findByRepairOrderId(repairOrderId)
                    .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote for RepairOrder", repairOrderId));
            return deliveryNoteMapper.toDetailResponse(entity);
    }

    @Override
    @Transactional
        public DeliveryNoteDetailResponse create(DeliveryNoteRequest request) {
        // 1. Resolve client
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));

        // 2. Validate TEMPORAL client restriction: only products allowed (no services)
        if (client.getClientType() == ClientType.TEMPORAL) {
            if (request.services() != null && !request.services().isEmpty()) {
                throw new BusinessRuleException(
                            "Los clientes temporales solo pueden tener remitos de productos, no de servicios");
            }
        }

            // 3. Optionally resolve vehicle (nullable for TEMPORAL client delivery notes)
        Vehicle vehicle = null;
        if (request.vehicleId() != null) {
            vehicle = vehicleRepository.findById(request.vehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
        }

        // 4. Optionally resolve repair order
        RepairOrder repairOrder = null;
        if (request.repairOrderId() != null) {
            repairOrder = repairOrderRepository.findById(request.repairOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", request.repairOrderId()));
        }

        // 5. Optionally resolve estimate
        Estimate estimate = null;
        if (request.estimateId() != null) {
            estimate = estimateRepository.findById(request.estimateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Estimate", request.estimateId()));
        }

        // 6. Build entity
            DeliveryNote entity = deliveryNoteMapper.toEntity(request);
        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setRepairOrder(repairOrder);
        entity.setEstimate(estimate);
            entity.setStatus(DeliveryNoteStatus.PENDIENTE);

        // 7. Add child entities (snapshot line items)
        addChildEntities(entity, request);

        // 8. Calculate and set total
        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), request.taxPercentage());
        entity.setTotal(total);

        // 9. Save
                DeliveryNote saved = deliveryNoteRepository.save(entity);
                log.info("Created delivery note with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
            public DeliveryNoteDetailResponse createFromEstimate(Long estimateId) {
                // 1. Get estimate delivery note data (validates ACEPTADO status)
                EstimatedDeliveryNoteDataResponse estimateData = estimateService.convertToDeliveryNoteData(estimateId);

                // 2. Map estimate line items to delivery note request DTOs
                List<DeliveryNoteServiceItemRequest> services = estimateData.services().stream()
                        .map(s -> new DeliveryNoteServiceItemRequest(s.serviceName(), s.price()))
                .toList();

                List<DeliveryNoteProductRequest> products = estimateData.products().stream()
                        .map(p -> new DeliveryNoteProductRequest(p.productName(), p.quantity(), p.unitPrice()))
                .toList();

                // 3. Build delivery note request from estimate data
                DeliveryNoteRequest request = new DeliveryNoteRequest(
                estimateData.clientId(),
                estimateData.vehicleId(),
                estimateData.repairOrderId(),
                estimateId,
                estimateData.discountPercentage(),
                estimateData.taxPercentage(),
                services,
                products
        );

        // 4. Delegate to standard create
        return create(request);
    }

    @Override
    @Transactional
    public void delete(Long id) {
                DeliveryNote deliveryNote = deliveryNoteRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));

                // Cannot delete delivery notes linked to a repair order
                if (deliveryNote.getRepairOrder() != null) {
            throw new BusinessRuleException(
                            "No se puede eliminar un remito asociado a una orden de trabajo");
        }

                // Cannot delete paid delivery notes
                if (deliveryNote.getStatus() == DeliveryNoteStatus.PAGADA) {
                    throw new BusinessRuleException("No se puede eliminar un remito que ya fue pagado");
        }

                deliveryNoteRepository.deleteById(id);
                log.info("Deleted delivery note with id {}", id);
    }

    @Override
            public BigDecimal calculateTotal(List<DeliveryNoteServiceItemRequest> services,
                                             List<DeliveryNoteProductRequest> products,
                                     BigDecimal discountPercentage,
                                     BigDecimal taxPercentage) {
        BigDecimal servicesTotal = BigDecimal.ZERO;
        if (services != null) {
                    for (DeliveryNoteServiceItemRequest svc : services) {
                servicesTotal = servicesTotal.add(svc.price());
            }
        }
        BigDecimal productsTotal = BigDecimal.ZERO;
        if (products != null) {
                    for (DeliveryNoteProductRequest prod : products) {
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
    @Transactional
    public void markAsPaid(Long id) {
                DeliveryNote entity = deliveryNoteRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("DeliveryNote", id));
                entity.setStatus(DeliveryNoteStatus.PAGADA);
                deliveryNoteRepository.save(entity);
                log.info("Marked delivery note {} as PAGADA", id);
    }

    // --- Private helpers ---

            private void addChildEntities(DeliveryNote entity, DeliveryNoteRequest request) {
        if (request.services() != null) {
                    for (DeliveryNoteServiceItemRequest svcReq : request.services()) {
                        DeliveryNoteServiceItem svc = DeliveryNoteServiceItem.builder()
                                .deliveryNote(entity)
                        .serviceName(svcReq.serviceName())
                        .price(svcReq.price())
                        .build();
                entity.getServices().add(svc);
            }
        }
        if (request.products() != null) {
                    for (DeliveryNoteProductRequest prodReq : request.products()) {
                        DeliveryNoteProduct prod = DeliveryNoteProduct.builder()
                                .deliveryNote(entity)
                        .productName(prodReq.productName())
                        .quantity(prodReq.quantity())
                        .unitPrice(prodReq.unitPrice())
                        .totalPrice(prodReq.unitPrice().multiply(BigDecimal.valueOf(prodReq.quantity())))
                        .build();
                entity.getProducts().add(prod);
            }
        }
    }
}
```

---

        ### 4.8 Controller — `DeliveryNoteController`

        Base path: `/api/delivery-notes`

```java
@RestController
        @RequestMapping("/api/delivery-notes")
@RequiredArgsConstructor
        public class DeliveryNoteController {

            private final DeliveryNoteService deliveryNoteService;

            // GET /api/delivery-notes?clientName={}&plate={}&status={}&page=0&size=12&sort=createdAt,desc
    @GetMapping
            public ResponseEntity<ApiResponse<Page<DeliveryNoteResponse>>> getAll(
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String plate,
                    @RequestParam(required = false) DeliveryNoteStatus status,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (clientName != null || plate != null || status != null) {
                    return ResponseEntity.ok(ApiResponse.success(deliveryNoteService.search(clientName, plate, status, pageable)));
        }
                return ResponseEntity.ok(ApiResponse.success(deliveryNoteService.getAll(pageable)));
    }

            // GET /api/delivery-notes/{id}
    @GetMapping("/{id}")
            public ResponseEntity<ApiResponse<DeliveryNoteDetailResponse>> getById(@PathVariable Long id) {
                return ResponseEntity.ok(ApiResponse.success(deliveryNoteService.getById(id)));
    }

            // POST /api/delivery-notes
    @PostMapping
            public ResponseEntity<ApiResponse<DeliveryNoteDetailResponse>> create(
                    @Valid @RequestBody DeliveryNoteRequest request) {
                DeliveryNoteDetailResponse created = deliveryNoteService.create(request);
                return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Remito creado", created));
    }

            // POST /api/delivery-notes/from-estimate/{estimateId}
    @PostMapping("/from-estimate/{estimateId}")
            public ResponseEntity<ApiResponse<DeliveryNoteDetailResponse>> createFromEstimate(
            @PathVariable Long estimateId) {
                DeliveryNoteDetailResponse created = deliveryNoteService.createFromEstimate(estimateId);
                return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Remito creado desde presupuesto", created));
    }

            // DELETE /api/delivery-notes/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
                deliveryNoteService.delete(id);
                return ResponseEntity.ok(ApiResponse.success("Remito eliminado", null));
    }
}
```

### 4.9 Repair Order Integration

        Add an endpoint in `RepairOrderController` to access the delivery note for a specific repair order:

```
        GET /api/repair-orders/{id}/delivery-note
```

```java
// In RepairOrderController (existing controller, add this endpoint)

        @GetMapping("/{id}/delivery-note")
        public ResponseEntity<ApiResponse<DeliveryNoteDetailResponse>> getDeliveryNoteByRepairOrder(@PathVariable Long id) {
            return ResponseEntity.ok(ApiResponse.success(deliveryNoteService.getByRepairOrderId(id)));
}
```

        The `RepairOrderService` injects `DeliveryNoteService` to coordinate, as per the cross-module orchestration pattern.

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/delivery-notes?clientName=&plate=&status=&page=0&size=12&sort=createdAt,desc` | List/search delivery notes (paginated, sortable by date) |
| `GET` | `/api/delivery-notes/{id}` | Get delivery note detail by ID |
| `POST` | `/api/delivery-notes` | Create new delivery note |
| `POST` | `/api/delivery-notes/from-estimate/{estimateId}` | Create delivery note pre-loaded from accepted estimate |
| `DELETE` | `/api/delivery-notes/{id}` | Delete delivery note (only standalone, not paid) |
| `GET` | `/api/repair-orders/{id}/delivery-note` | Get delivery note linked to a repair order |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   └── deliveryNotes.ts
├── features/
│   └── delivery-notes/
│       ├── components/
│       │   ├── DeliveryNoteList.tsx
│       │   ├── DeliveryNoteDetail.tsx
│       │   ├── DeliveryNoteDataTab.tsx
│       │   ├── PaymentsTabPlaceholder.tsx
│       │   ├── ServicesGrid.tsx
│       │   ├── ProductsGrid.tsx
│       │   ├── DeliveryNoteSummary.tsx
│       │   └── DeliveryNoteTab.tsx          ← for repair order detail
│       └── hooks/
│           ├── useDeliveryNotes.ts
│           └── useDeliveryNote.ts
├── pages/
│   ├── DeliveryNotesPage.tsx
│   └── DeliveryNoteDetailPage.tsx
└── types/
    └── deliveryNote.ts
```

---

### 5.2 Types (`src/types/deliveryNote.ts`)

```ts
// ---- Delivery Note Status ----

export type DeliveryNoteStatus = "PENDIENTE" | "PAGADA";

// ---- Service Line Item ----

export interface DeliveryNoteServiceItemRequest {
  serviceName: string;
  price: number;
}

export interface DeliveryNoteServiceItemResponse {
  id: number;
  serviceName: string;
  price: number;
}

// ---- Product Line Item ----

export interface DeliveryNoteProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryNoteProductResponse {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ---- Delivery Note ----

export interface DeliveryNoteRequest {
  clientId: number;
  vehicleId: number | null;
  repairOrderId: number | null;
  estimateId: number | null;
  discountPercentage: number;
  taxPercentage: number;
  services: DeliveryNoteServiceItemRequest[];
  products: DeliveryNoteProductRequest[];
}

// List view row
export interface DeliveryNoteResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  vehicleId: number | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  repairOrderId: number | null;
  estimateId: number | null;
  status: DeliveryNoteStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  createdAt: string;
  updatedAt: string;
}

// Detail view
export interface DeliveryNoteDetailResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  clientDni: string | null;
  clientPhone: string;
  clientEmail: string | null;
  clientType: string; // "PERSONAL" | "EMPRESA" | "TEMPORAL"
  vehicleId: number | null;
  vehiclePlate: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  repairOrderId: number | null;
  estimateId: number | null;
  status: DeliveryNoteStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  services: DeliveryNoteServiceItemResponse[];
  products: DeliveryNoteProductResponse[];
  createdAt: string;
  updatedAt: string;
}
```

---

### 5.3 API Layer (`src/api/deliveryNotes.ts`)

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Page } from "@/types/pagination";
import type {
  DeliveryNoteResponse,
  DeliveryNoteDetailResponse,
  DeliveryNoteRequest,
  DeliveryNoteStatus,
} from "@/types/deliveryNote";

export const deliveryNotesApi = {
  getAll: (params: {
    clientName?: string;
    plate?: string;
    status?: DeliveryNoteStatus;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    apiClient.get<ApiResponse<Page<DeliveryNoteResponse>>>("/delivery-notes", {
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
    apiClient.get<ApiResponse<DeliveryNoteDetailResponse>>(`/delivery-notes/${id}`),

  getByRepairOrderId: (repairOrderId: number) =>
    apiClient.get<ApiResponse<DeliveryNoteDetailResponse>>(
      `/repair-orders/${repairOrderId}/delivery-note`
    ),

  create: (data: DeliveryNoteRequest) =>
    apiClient.post<ApiResponse<DeliveryNoteDetailResponse>>("/delivery-notes", data),

  createFromEstimate: (estimateId: number) =>
    apiClient.post<ApiResponse<DeliveryNoteDetailResponse>>(
      `/delivery-notes/from-estimate/${estimateId}`
    ),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/delivery-notes/${id}`),
};
```

---

### 5.4 Hooks

#### `src/features/delivery-notes/hooks/useDeliveryNotes.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { deliveryNotesApi } from "@/api/deliveryNotes";
import type { DeliveryNoteResponse, DeliveryNoteStatus } from "@/types/deliveryNote";

export function useDeliveryNotes() {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [clientName, setClientName] = useState<string | undefined>(undefined);
  const [plate, setPlate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<DeliveryNoteStatus | undefined>(undefined);

  const fetchDeliveryNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryNotesApi.getAll({
        clientName,
        plate,
        status,
        page,
        size: pageSize,
      });
      setDeliveryNotes(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch (err) {
      setError("Error al cargar remitos");
    } finally {
      setLoading(false);
    }
  }, [clientName, plate, status, page, pageSize]);

  useEffect(() => {
    fetchDeliveryNotes();
  }, [fetchDeliveryNotes]);

  const deleteDeliveryNote = async (id: number) => {
    await deliveryNotesApi.delete(id);
    fetchDeliveryNotes();
  };

  return {
    deliveryNotes,
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
    deleteDeliveryNote,
    refetch: fetchDeliveryNotes,
  };
}
```

#### `src/features/delivery-notes/hooks/useDeliveryNote.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { deliveryNotesApi } from "@/api/deliveryNotes";
import type {
  DeliveryNoteDetailResponse,
  DeliveryNoteRequest,
} from "@/types/deliveryNote";

export function useDeliveryNote(id?: number, repairOrderId?: number) {
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNoteDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryNote = useCallback(async () => {
    if (!id && !repairOrderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (id) {
        const res = await deliveryNotesApi.getById(id);
        setDeliveryNote(res.data.data);
      } else if (repairOrderId) {
        const res = await deliveryNotesApi.getByRepairOrderId(repairOrderId);
        setDeliveryNote(res.data.data);
      }
    } catch (err) {
      setError("Error al cargar el remito");
    } finally {
      setLoading(false);
    }
  }, [id, repairOrderId]);

  useEffect(() => {
      fetchDeliveryNote();
    }, [fetchDeliveryNote]);

    const createDeliveryNote = async (data: DeliveryNoteRequest) => {
    const res = await deliveryNotesApi.create(data);
      setDeliveryNote(res.data.data);
    return res.data.data;
  };

  const createFromEstimate = async (estimateId: number) => {
    const res = await deliveryNotesApi.createFromEstimate(estimateId);
      setDeliveryNote(res.data.data);
    return res.data.data;
  };

  return {
    deliveryNote,
    loading,
    error,
      createDeliveryNote,
    createFromEstimate,
      refetch: fetchDeliveryNote,
  };
}
```

---

### 5.5 Pages

#### `DeliveryNotesPage` — route: `/remitos`

**UI Layout:**
- Page title: **"Remitos"**
- Filter bar:
  - `TextField` with placeholder: "Buscar por nombre de cliente o patente..."
  - `Select` for status: Todos, Pendiente, Pagada
- `Button` "Crear nuevo remito" → navigates to `/remitos/nueva`
- `DeliveryNoteList` DataGrid component (see below)

```tsx
// src/pages/DeliveryNotesPage.tsx
export default function DeliveryNotesPage() {
  const {
    deliveryNotes, loading, error, totalCount,
    page, setPage, pageSize, setPageSize,
    clientName, setClientName, plate, setPlate,
    status, setStatus, deleteDeliveryNote,
  } = useDeliveryNotes();

  const navigate = useNavigate();

  const handleRowClick = (row: DeliveryNoteResponse) => {
    if (row.repairOrderId != null) {
      // Navigate to repair order detail, "remito" tab
      navigate(`/ordenes-trabajo/${row.repairOrderId}?tab=remito`);
    } else {
      navigate(`/remitos/${row.id}`);
    }
  };
  const handleCreate = () => navigate("/remitos/nueva");

  return (
    <Box>
      <Typography variant="h4">remitos</Typography>
      <Box /* filter bar */>
        <TextField placeholder="Buscar por nombre de cliente..." onChange={...} />
        <TextField placeholder="Buscar por patente..." onChange={...} />
        <Select value={status ?? ""} onChange={...}>
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="PENDIENTE">Pendiente</MenuItem>
          <MenuItem value="PAGADA">Pagada</MenuItem>
        </Select>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Crear nuevo remito
        </Button>
      </Box>
      <DeliveryNoteList
        rows={deliveryNotes}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRowClick={handleRowClick}
        onDelete={deleteDeliveryNote}
      />
    </Box>
  );
}
```

#### `DeliveryNoteDetailPage` — route: `/remitos/:id` and `/remitos/nuevo`

```tsx
// src/pages/DeliveryNoteDetailPage.tsx
export default function DeliveryNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const estimateId = searchParams.get("estimateId")
    ? Number(searchParams.get("estimateId"))
    : undefined;

  const isNew = id === "nueva";
  const deliveryNoteId = isNew ? undefined : Number(id);

  // Uses useDeliveryNote hook to fetch existing or start with empty state
  // If estimateId is present, pre-loads from estimate via estimatesApi.getDeliveryNoteData(estimateId)
  return <DeliveryNoteDetail deliveryNoteId={deliveryNoteId} estimateId={estimateId} />;
}
```

---

### 5.6 Components

#### `DeliveryNoteList` (`src/features/deliveryNotes/components/DeliveryNoteList.tsx`)

Uses MUI `DataGrid` from `@mui/x-data-grid`.

```tsx
interface DeliveryNoteListProps {
  rows: DeliveryNoteResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (row: DeliveryNoteResponse) => void;
  onDelete: (id: number) => void;
}

export function DeliveryNoteList({ ... }: DeliveryNoteListProps) {
  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha de creación",
      width: 180,
      valueFormatter: (value) => new Date(value).toLocaleDateString("es-AR"),
    },
    { field: "clientFullName", headerName: "Cliente", flex: 1 },
    {
      field: "vehiclePlate",
      headerName: "Patente",
      width: 120,
      valueFormatter: (value) => value ?? "—",
    },
    {
      field: "status",
      headerName: "Estado",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value === "PAGADA" ? "Pagada" : "Pendiente"}
          color={params.value === "PAGADA" ? "success" : "warning"}
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
      width: 140,
      sortable: false,
      renderCell: (params) => {
        const isFromRepairOrder = params.row.repairOrderId != null;
        return (
          <>
            <IconButton
              onClick={(e) => { e.stopPropagation(); onRowClick(params.row); }}
              size="small"
            >
              <VisibilityIcon />
            </IconButton>
            <Tooltip title={isFromRepairOrder ? "No se puede eliminar un remito de orden de trabajo" : "Eliminar"}>
              <span>
                <IconButton
                  onClick={(e) => { e.stopPropagation(); onDelete(params.row.id); }}
                  color="error"
                  size="small"
                  disabled={isFromRepairOrder}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </>
        );
      },
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
      onRowClick={(params) => onRowClick(params.row)}
    />
  );
}
```

#### `DeliveryNoteDetail` (`src/features/deliveryNotes/components/DeliveryNoteDetail.tsx`)

The main detail component, used both from `DeliveryNoteDetailPage` and `DeliveryNoteTab`.

```tsx
interface DeliveryNoteDetailProps {
  deliveryNoteId?: number;        // undefined = create mode
  repairOrderId?: number;    // set when rendered inside repair order tab
  estimateId?: number;       // set when pre-loading from an estimate
}

export function DeliveryNoteDetail({ deliveryNoteId, repairOrderId, estimateId }: DeliveryNoteDetailProps) {
  const { deliveryNote, loading, error, createDeliveryNote, createFromEstimate } =
    useDeliveryNote(deliveryNoteId, repairOrderId);

  const [activeTab, setActiveTab] = useState(0);
  const isCreateMode = !deliveryNoteId && !deliveryNote;

  // If estimateId provided, pre-load data from estimate via estimatesApi.getDeliveryNoteData(estimateId)
  // This populates the form with services, products, discount, tax, client, vehicle

  return (
    <Box>
      <Typography variant="h4">
        {isCreateMode ? "Nuevo remito" : `Remito #${deliveryNote?.id}`}
      </Typography>

      {/* Download button (only in view mode) */}
      {!isCreateMode && (
        <Button startIcon={<DownloadIcon />} onClick={() => window.print()}>
          Descargar remito
        </Button>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Datos de la remito" />
        <Tab label="Pagos" disabled={isCreateMode} />
      </Tabs>

      {activeTab === 0 && (
        <DeliveryNoteDataTab
          deliveryNote={deliveryNote}
          isCreateMode={isCreateMode}
          estimateId={estimateId}
          onSubmit={createDeliveryNote}
        />
      )}

      {activeTab === 1 && (
        <PaymentsTabPlaceholder deliveryNoteId={deliveryNote?.id} />
      )}
    </Box>
  );
}
```

#### `DeliveryNoteDataTab` (`src/features/deliveryNotes/components/DeliveryNoteDataTab.tsx`)

Contains the delivery note form content for the first tab.

```tsx
interface DeliveryNoteDataTabProps {
  deliveryNote: DeliveryNoteDetailResponse | null;
  isCreateMode: boolean;
  estimateId?: number;
  onSubmit: (data: DeliveryNoteRequest) => Promise<DeliveryNoteDetailResponse>;
}

export function DeliveryNoteDataTab({ deliveryNote, isCreateMode, estimateId, onSubmit }: DeliveryNoteDataTabProps) {
  // State for form fields
  const [clientId, setClientId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [services, setServices] = useState<DeliveryNoteServiceItemRequest[]>([]);
  const [products, setProducts] = useState<DeliveryNoteProductRequest[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [isTemporalClient, setIsTemporalClient] = useState(false);

  // If estimateId → pre-load from estimate via estimatesApi.getDeliveryNoteData(estimateId)
  // If viewing existing → populate from deliveryNote prop (readonly)

  // --- Header: Client fields ---
  // Autocomplete for client (dropdown + auto-fill readonly fields: name, dni, phone, email)
  // On client select → check if TEMPORAL type → set isTemporalClient flag
  //   If TEMPORAL → clear services array, disable ServicesGrid
  // On client select → clear vehicle, load client's vehicles

  // --- Header: Vehicle fields ---
  // Autocomplete for vehicle (cascading from selected client — dropdown + auto-fill readonly: plate, brand, model)
  // Disabled until a client is selected
  // For TEMPORAL clients, vehicle is optional

  // --- ServicesGrid (hidden/disabled for TEMPORAL clients) ---
  {!isTemporalClient && (
    <ServicesGrid services={services} onChange={setServices} readonly={!isCreateMode} />
  )}

  // --- ProductsGrid ---
  <ProductsGrid products={products} onChange={setProducts} readonly={!isCreateMode} />

  // --- DeliveryNoteSummary ---
  <DeliveryNoteSummary
    servicesSubtotal={servicesSubtotal}
    productsSubtotal={productsSubtotal}
    discountPercentage={discountPercentage}
    taxPercentage={taxPercentage}
    onDiscountChange={setDiscountPercentage}
    onTaxChange={setTaxPercentage}
    readonly={!isCreateMode}
  />

  // --- Create button with confirmation dialog ---
  {isCreateMode && (
    <Button variant="contained" onClick={handleCreateWithConfirmation}>
      Crear remito
    </Button>
  )}

  // Confirmation dialog (MUI Dialog):
  // "¿Está seguro de que los datos son correctos? Una vez creada, la remito no se podrá editar."
  // Buttons: "Cancelar", "Confirmar"

  return ( /* ... */ );
}
```

**Header — Client/Vehicle Autocomplete Pattern:**
- `Autocomplete` for client: fetches `/api/clients?query=...` as the user types.
- On client selection: auto-fills readonly `TextField` fields for name, DNI, phone, email. Checks `clientType` — if `TEMPORAL`, enables products-only restriction. Clears vehicle selection. Fetches `/api/vehicles?clientId=...` for the vehicle dropdown.
- `Autocomplete` for vehicle (cascading): disabled until a client is selected. Fetches vehicles for the selected client. Optional for TEMPORAL clients.
- On vehicle selection: auto-fills readonly `TextField` fields for plate, brand, model.
- If client changes after a vehicle is already selected: vehicle selection and its fields are cleared.
- In **view mode** (existing deliveryNote): all fields are readonly. Data is populated from the `deliveryNote` prop.

#### `PaymentsTabPlaceholder` (`src/features/deliveryNotes/components/PaymentsTabPlaceholder.tsx`)

Temporary placeholder until spec 10 (Pagos) is implemented.

```tsx
interface PaymentsTabPlaceholderProps {
  deliveryNoteId?: number;
}

export function PaymentsTabPlaceholder({ deliveryNoteId }: PaymentsTabPlaceholderProps) {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Pagos — Próximamente
      </Typography>
      <Typography color="text.secondary">
        La gestión de pagos para esta remito estará disponible pronto.
      </Typography>
    </Box>
  );
}
```

> **Note**: This component will be fully replaced by spec 10 (Pagos) which implements the payment summary, cash payment modal, bank account payment modal, and payment history grid.

#### `ServicesGrid` (`src/features/deliveryNotes/components/ServicesGrid.tsx`)

```tsx
interface ServicesGridProps {
  services: DeliveryNoteServiceItemRequest[];
  onChange: (services: DeliveryNoteServiceItemRequest[]) => void;
  readonly?: boolean;
}

export function ServicesGrid({ services, onChange, readonly = false }: ServicesGridProps) {
  // Button "Agregar servicio" → appends empty row { serviceName: "", price: 0 }
  // Each row:
  //   Column 1: Autocomplete for serviceName
  //     - Fetches /api/services?query=... as user types (freeSolo)
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
        <Box key={index} sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1 }}>
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
            sx={{ flex: 1 }}
          />
          <TextField
            type="number"
            label="Precio"
            value={svc.price}
            onChange={(e) => updateServicePrice(index, Number(e.target.value))}
            disabled={readonly}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
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
      <Typography variant="subtitle1" sx={{ mt: 1 }}>
        Subtotal servicios: ${servicesSubtotal.toFixed(2)}
      </Typography>
    </Box>
  );
}
```

#### `ProductsGrid` (`src/features/deliveryNotes/components/ProductsGrid.tsx`)

```tsx
interface ProductsGridProps {
  products: DeliveryNoteProductRequest[];
  onChange: (products: DeliveryNoteProductRequest[]) => void;
  readonly?: boolean;
}

export function ProductsGrid({ products, onChange, readonly = false }: ProductsGridProps) {
  // Button "Agregar producto" → appends empty row { productName: "", quantity: 1, unitPrice: 0 }
  // Each row:
  //   Column 1: Autocomplete for productName
  //     - Fetches /api/products?query=... as user types (freeSolo)
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
        <Box key={index} sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1 }}>
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
            sx={{ flex: 1 }}
          />
          <TextField
            type="number"
            label="Cantidad"
            value={prod.quantity}
            onChange={(e) => updateProductQuantity(index, Number(e.target.value))}
            disabled={readonly}
            sx={{ width: 100 }}
          />
          <TextField
            type="number"
            label="Precio unitario"
            value={prod.unitPrice}
            onChange={(e) => updateProductUnitPrice(index, Number(e.target.value))}
            disabled={readonly}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
          <TextField
            label="Precio total"
            value={(prod.quantity * prod.unitPrice).toFixed(2)}
            InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            sx={{ width: 140 }}
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
      <Typography variant="subtitle1" sx={{ mt: 1 }}>
        Subtotal productos: ${productsSubtotal.toFixed(2)}
      </Typography>
    </Box>
  );
}
```

#### `DeliveryNoteSummary` (`src/features/deliveryNotes/components/DeliveryNoteSummary.tsx`)

```tsx
interface DeliveryNoteSummaryProps {
  servicesSubtotal: number;
  productsSubtotal: number;
  discountPercentage: number;
  taxPercentage: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  readonly?: boolean;
}

export function DeliveryNoteSummary({
  servicesSubtotal,
  productsSubtotal,
  discountPercentage,
  taxPercentage,
  onDiscountChange,
  onTaxChange,
  readonly = false,
}: DeliveryNoteSummaryProps) {
  const subtotal = servicesSubtotal + productsSubtotal;
  const discountAmount = subtotal * (discountPercentage / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercentage / 100);
  const finalPrice = afterDiscount + taxAmount;

  return (
    <Box>
      <Typography variant="h6">Resumen</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
        <Typography variant="h6">
          Precio final: ${finalPrice.toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
}
```

#### `DeliveryNoteTab` (`src/features/deliveryNotes/components/DeliveryNoteTab.tsx`)

This component replaces the placeholder "remito" tab in the repair order detail view (from spec 06).

```tsx
interface DeliveryNoteTabProps {
  repairOrderId: number;
}

export function DeliveryNoteTab({ repairOrderId }: DeliveryNoteTabProps) {
  const { deliveryNote, loading, error, createDeliveryNote } = useDeliveryNote(undefined, repairOrderId);

  if (loading) return <CircularProgress />;
  if (error && !deliveryNote) {
    // No deliveryNote yet — show creation form
    return <DeliveryNoteDetail repairOrderId={repairOrderId} />;
  }

  // deliveryNote exists — show detail view (readonly data tab + payments tab)
  return <DeliveryNoteDetail deliveryNoteId={deliveryNote?.id} repairOrderId={repairOrderId} />;
}
```

**Integration with Repair Order Detail:**

In `RepairOrderDetailPage`, replace the placeholder `<Typography>Próximamente</Typography>` for the "remito" tab with:

```tsx
{activeTab === 4 && <DeliveryNoteTab repairOrderId={repairOrderId} />}
```

---

### 5.7 Routes

Add the following routes to `src/routes/`:

```tsx
import { lazy } from "react";

const DeliveryNotesPage = lazy(() => import("@/pages/DeliveryNotesPage"));
const DeliveryNoteDetailPage = lazy(() => import("@/pages/DeliveryNoteDetailPage"));

// Route definitions
{ path: "/remitos", element: <DeliveryNotesPage /> }
{ path: "/remitos/nueva", element: <DeliveryNoteDetailPage /> }
{ path: "/remitos/:id", element: <DeliveryNoteDetailPage /> }
```

---

## 6. Business Rules

### 6.1 Immutability After Creation

Once a delivery note is created, its data cannot be edited. This includes:
- Client and vehicle information
- Services and products line items (names, quantities, prices)
- Discount and tax percentages
- Total amount

The only mutable field is `status`, which transitions from `PENDIENTE` to `PAGADA` automatically when total payments equal the delivery note total (handled by spec 10 — Pagos).

**UI enforcement**: In view mode (`isCreateMode = false`), all form fields, grids, and summary fields are rendered as `readonly` / `disabled`.

**Backend enforcement**: There is no `PUT /api/delivery-notes/{id}` endpoint. The only write operations are `POST` (create) and `DELETE` (delete, with restrictions).

### 6.2 TEMPORAL Client Restriction (remito Anónima)

When the selected client has `clientType = "TEMPORAL"`:
- **Only products are allowed** — the services grid is hidden/disabled.
- The delivery note request must have an empty `services` list. If non-empty, the backend throws a `BusinessRuleException` with message: `"Los clientes temporales solo pueden tener remitos de productos, no de servicios"`.
- Vehicle is **optional** for TEMPORAL clients (the DB column `vehicle_id` is nullable).
- The TEMPORAL client must already exist in the system (created via the client creation form with type `TEMPORAL` — only name + phone required).

**UI flow**: When a TEMPORAL client is selected from the dropdown, the `ServicesGrid` component is hidden and the vehicle `Autocomplete` becomes optional.

### 6.3 Estimate Pre-Loading

When creating a delivery note from an approved estimate (via the "remitir" action in spec 08):

1. The user clicks "remitir" on an `ACEPTADO` estimate → navigates to `/remitos/nueva?estimateId={id}`.
2. The `DeliveryNoteDetailPage` reads the `estimateId` query parameter.
3. On mount, calls `GET /api/estimates/{id}/deliveryNote-data` to get the `EstimatedDeliveryNoteDataResponse`.
4. Pre-populates the delivery note creation form with: `clientId`, `vehicleId`, `repairOrderId`, services, products, discount %, tax %.
5. The user can review and modify the pre-loaded data before confirming creation.
6. On submit, sends `POST /api/delivery-notes` with the `estimateId` field set to link the delivery note to the estimate.

Alternatively, the backend endpoint `POST /api/delivery-notes/from-estimate/{estimateId}` can be used to create the delivery note directly from the estimate data without user modification.

### 6.4 Snapshot Line Items

Service and product line items in deliveryNotes are **snapshots** — they copy the name and price values at creation time. They do not reference the services/products catalog tables via FK. If catalog prices change later, existing deliveryNotes are unaffected.

### 6.5 Status Auto-Update

The delivery note `status` auto-transitions from `PENDIENTE` to `PAGADA` when the sum of all associated payments equals or exceeds the delivery note `total`. This logic is handled by the payment module (spec 10), which calls `DeliveryNoteService.markAsPaid(deliveryNoteId)` after each payment is recorded.

### 6.6 Deletion Restrictions

- **Cannot delete** delivery notes linked to a repair order (`repairOrderId != null`). The backend throws: `"No se puede eliminar un remito asociado a una orden de trabajo"`.
- **Cannot delete** delivery notes that have been fully paid (`status = PAGADA`). The backend throws: `"No se puede eliminar un remito que ya fue pagado"`.
- **UI enforcement**: In the `DeliveryNoteList` grid, the delete action button is disabled for deliveryNotes that came from a repair order. A tooltip explains the restriction.

### 6.7 Total Calculation

```
servicesTotal = SUM(service.price) for all services
productsTotal = SUM(product.unitPrice * product.quantity) for all products
subtotal = servicesTotal + productsTotal
discountAmount = subtotal * (discountPercentage / 100)
afterDiscount = subtotal - discountAmount
taxAmount = afterDiscount * (taxPercentage / 100)
total = afterDiscount + taxAmount
```

Rounding: `HALF_UP` to 2 decimal places at each step.

---

## 7. Testing

### 7.1 Backend — Unit Tests

#### `DeliveryNoteServiceImplTest`

Use JUnit 5 + Mockito. Mock all repositories and the `EstimateService` interface.

```java
@ExtendWith(MockitoExtension.class)
class DeliveryNoteServiceImplTest {

    @InjectMocks
    private DeliveryNoteServiceImpl DeliveryNoteService;

    @Mock private DeliveryNoteRepository DeliveryNoteRepository;
    @Mock private DeliveryNoteMapper DeliveryNoteMapper;
    @Mock private ClientRepository clientRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private RepairOrderRepository repairOrderRepository;
    @Mock private EstimateService estimateService;
}
```

**Test cases:**

| Method | Test | Description |
|---|---|---|
| `create` | `shouldcreateDeliveryNoteSuccessfully` | Happy path: valid client, vehicle, services, products → returns `DeliveryNoteDetailResponse` |
| `create` | `shouldThrowWhenClientNotFound` | Client ID does not exist → `ResourceNotFoundException` |
| `create` | `shouldThrowWhenTemporalClientHasServices` | TEMPORAL client with non-empty services list → `BusinessRuleException` |
| `create` | `shouldcreateDeliveryNoteForTemporalClientWithProductsOnly` | TEMPORAL client with only products → success |
| `create` | `shouldcreateDeliveryNoteWithNullVehicleForTemporalClient` | TEMPORAL client with null vehicleId → success |
| `create` | `shouldCreateDeliveryNoteWithEstimateLink` | Request with estimateId set → deliveryNote links to estimate |
| `createFromEstimate` | `shouldCreateDeliveryNoteFromAcceptedEstimate` | ACEPTADO estimate → deliveryNote pre-loaded from estimate data |
| `createFromEstimate` | `shouldThrowWhenEstimateNotAccepted` | Non-ACEPTADO estimate → `BusinessRuleException` from `estimateService.convertToDeliveryNoteData` |
| `getById` | `shouldReturnDeliveryNoteById` | Existing ID → returns detail response |
| `getById` | `shouldThrowWhenDeliveryNoteNotFound` | Non-existing ID → `ResourceNotFoundException` |
| `getByRepairOrderId` | `shouldReturnDeliveryNoteByRepairOrderId` | Existing repair order with deliveryNote → returns detail response |
| `getByRepairOrderId` | `shouldThrowWhenNoDeliveryNoteForRepairOrder` | Repair order without deliveryNote → `ResourceNotFoundException` |
| `getAll` | `shouldReturnPaginateddeliveryNotes` | Returns paginated list of `DeliveryNoteResponse` |
| `search` | `shouldFilterByClientName` | Search by client name → filtered results |
| `search` | `shouldFilterByPlate` | Search by plate → filtered results |
| `search` | `shouldFilterByStatus` | Search by status → filtered results |
| `delete` | `shouldDeleteStandaloneDeliveryNote` | deliveryNote without repair order, not paid → deleted |
| `delete` | `shouldThrowWhenDeletingRepairOrderDeliveryNote` | deliveryNote with repairOrderId → `BusinessRuleException` |
| `delete` | `shouldThrowWhenDeletingPaidDeliveryNote` | deliveryNote with status PAGADA → `BusinessRuleException` |
| `delete` | `shouldThrowWhenDeliveryNoteNotFoundForDelete` | Non-existing ID → `ResourceNotFoundException` |
| `calculateTotal` | `shouldCalculateTotalCorrectly` | Services + products + discount + tax → correct total |
| `calculateTotal` | `shouldHandleZeroDiscountAndTax` | No discount, no tax → total = subtotal |
| `calculateTotal` | `shouldHandleEmptyServicesList` | No services, only products → correct total |
| `calculateTotal` | `shouldHandleEmptyProductsList` | No products, only services → correct total |
| `markAsPaid` | `shouldMarkDeliveryNoteAsPaid` | Existing deliveryNote → status set to PAGADA |
| `markAsPaid` | `shouldThrowWhenDeliveryNoteNotFoundFormarkAsPaid` | Non-existing ID → `ResourceNotFoundException` |

### 7.2 Frontend — Component Tests

Use Vitest + React Testing Library.

**Test files:**

| Component | Test file | Key tests |
|---|---|---|
| `DeliveryNoteList` | `DeliveryNoteList.test.tsx` | Renders grid columns; handles empty state; calls `onRowClick`; disables delete for repair order deliveryNotes; calls `onDelete` for standalone deliveryNotes |
| `DeliveryNoteDetail` | `DeliveryNoteDetail.test.tsx` | Renders create mode with empty form; renders view mode with readonly fields; shows confirmation dialog on create; switches between tabs |
| `DeliveryNoteDataTab` | `DeliveryNoteDataTab.test.tsx` | Shows client/vehicle autocompletes in create mode; hides services grid for TEMPORAL clients; pre-loads estimate data; disables fields in view mode |
| `ServicesGrid` | `ServicesGrid.test.tsx` | Adds service row; removes service row; updates service name and price; shows subtotal; renders readonly |
| `ProductsGrid` | `ProductsGrid.test.tsx` | Adds product row; removes product row; updates quantity/price; calculates row total; shows subtotal; renders readonly |
| `DeliveryNoteSummary` | `DeliveryNoteSummary.test.tsx` | Calculates final price; clamps discount 0–100; clamps tax 0–100; renders readonly |
| `DeliveryNoteTab` | `DeliveryNoteTab.test.tsx` | Shows creation form when no deliveryNote exists; shows detail view when deliveryNote exists |
| `PaymentsTabPlaceholder` | `PaymentsTabPlaceholder.test.tsx` | Renders placeholder text "Próximamente" |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend

- [x] Create `DeliveryNoteStatus` enum (`PENDIENTE`, `PAGADA`)
- [x] Create `deliveryNote` entity (relationships: `Client`, `Vehicle`, `RepairOrder`, `Estimate`, `DeliveryNoteServiceItem`, `DeliveryNoteProduct`)
- [x] Create `DeliveryNoteServiceItem` entity (relationship: `deliveryNote`)
- [x] Create `DeliveryNoteProduct` entity (relationship: `deliveryNote`)
- [x] Create `DeliveryNoteRepository` with methods: `findWithDetailsById`, `findByRepairOrderId`, `findByestimateId`, `search` (custom JPQL query)
- [x] Create `DeliveryNoteServiceItemRepository` with methods: `findByDeliveryNoteId`, `deleteByDeliveryNoteId`
- [x] Create `DeliveryNoteProductRepository` with methods: `findByDeliveryNoteId`, `deleteByDeliveryNoteId`
- [x] Create `DeliveryNoteRequest` record with Jakarta Validation annotations (`@NotNull`, `@DecimalMin`, `@DecimalMax`, `@Digits`, `@Valid`)
- [x] Create `DeliveryNoteServiceItemRequest` record with Jakarta Validation annotations (`@NotBlank`, `@Size`, `@NotNull`, `@DecimalMin`, `@Digits`)
- [x] Create `DeliveryNoteProductRequest` record with Jakarta Validation annotations (`@NotBlank`, `@Size`, `@NotNull`, `@Min`, `@DecimalMin`, `@Digits`)
- [x] Create `DeliveryNoteResponse` record (list view DTO)
- [x] Create `DeliveryNoteDetailResponse` record (detail view DTO with client/vehicle/estimate data)
- [x] Create `DeliveryNoteServiceItemResponse` record
- [x] Create `DeliveryNoteProductResponse` record
- [x] Create `DeliveryNoteMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md)
  - [x] `toResponse(deliveryNote)` → `DeliveryNoteResponse`
  - [x] `toDetailResponse(deliveryNote)` → `DeliveryNoteDetailResponse`
  - [x] `toServiceItemResponse(DeliveryNoteServiceItem)` → `DeliveryNoteServiceItemResponse`
  - [x] `toProductResponse(DeliveryNoteProduct)` → `DeliveryNoteProductResponse`
  - [x] `toEntity(DeliveryNoteRequest)` → `deliveryNote`
- [x] Create `DeliveryNoteService` interface
- [x] Create `DeliveryNoteServiceImpl` implementation
  - [x] `getAll(Pageable)` — paginated list of all deliveryNotes
  - [x] `search(clientName, plate, status, Pageable)` — filtered search
  - [x] `getById(Long)` — detail response
  - [x] `getByRepairOrderId(Long)` — detail for repair order's deliveryNote
  - [x] `create(DeliveryNoteRequest)` — create deliveryNote with children, validate TEMPORAL client restriction, calculate total
  - [x] `createFromEstimate(Long)` — create deliveryNote pre-loaded from ACEPTADO estimate
  - [x] `delete(Long)` — delete deliveryNote (only standalone, not paid)
  - [x] `calculateTotal(services, products, discount, tax)` — total calculation logic
  - [x] `markAsPaid(Long)` — set status to PAGADA
- [x] Create `DeliveryNoteController` with all endpoints:
  - [x] `GET /api/delivery-notes` — list/search (paginated)
- [x] `GET /api/delivery-notes/{id}` — get by ID
- [x] `POST /api/delivery-notes` — create
- [x] `POST /api/delivery-notes/from-estimate/{estimateId}` — create from accepted estimate
- [x] `DELETE /api/delivery-notes/{id}` — delete
- [x] `GET /api/repair-orders/{id}/delivery-note` endpoint in `RepairOrderController`
- [x] Verify backend compiles: `./mvnw clean compile`
- [x] Verify backend starts: `./mvnw clean spring-boot:run` (N/A — verified via compile + all tests pass)

### 8.2 Frontend

- [x] Create types file `src/types/deliveryNote.ts` (`DeliveryNoteStatus`, `DeliveryNoteServiceItemRequest`, `DeliveryNoteServiceItemResponse`, `DeliveryNoteProductRequest`, `DeliveryNoteProductResponse`, `DeliveryNoteRequest`, `DeliveryNoteResponse`, `DeliveryNoteDetailResponse`)
- [x] Create API layer `src/api/deliveryNotes.ts` (all deliveryNote API methods)
- [x] Create `useDeliveryNotes` hook — list with pagination, filtering, delete
- [x] Create `useDeliveryNote` hook — single deliveryNote fetch, create, createFromEstimate
- [x] Create `DeliveryNotesPage` — route `/remitos` with filters and DataGrid
- [x] Create `DeliveryNoteDetailPage` — route `/remitos/:id` and `/remitos/nueva` with estimateId query param support (note: uses `/remitos/nuevo` to match Spanish convention)
- [x] Create `DeliveryNoteList` component — DataGrid with columns (date, client, plate, status chip, repair order, total, actions with view/delete)
- [x] Create `DeliveryNoteDetail` component — main detail with tabs (Datos de la remito / Pagos), download button
- [x] Create `DeliveryNoteDataTab` component — merged into `DeliveryNoteDetail` (following EstimateDetail pattern)
- [x] Create `PaymentsTabPlaceholder` component — placeholder "Próximamente" for payments tab
- [x] Create `ServicesGrid` component — editable services grid with catalog autocomplete, add/remove rows, subtotal (hidden for TEMPORAL clients)
- [x] Create `ProductsGrid` component — editable products grid with catalog autocomplete, quantity, unit price, total price, add/remove rows, subtotal
- [x] Create `DeliveryNoteSummary` component — discount %, tax %, final price calculation
- [x] Create `DeliveryNoteTab` component — for repair order detail "remito" tab
- [x] Register routes with lazy loading (`/remitos`, `/remitos/nuevo`, `/remitos/:id`)
- [x] Verify frontend compiles
- [x] Verify frontend runs (vite build passes)

### 8.3 Business Rules Verification

- [x] Immutability after creation: no PUT endpoint, all fields readonly in view mode
- [x] TEMPORAL client restriction: only products allowed, no services; vehicle optional
- [x] Estimate pre-loading: `/remitos/nuevo?estimateId={id}` copies services, products, discount, tax from ACEPTADO estimate
- [x] Snapshot line items: service/product names and prices are copied by value at creation
- [x] Status auto-update: PENDIENTE → PAGADA when total payments equal delivery note total (handled by spec 10)
- [x] Deletion restrictions: cannot delete deliveryNotes linked to repair order or with status PAGADA
- [x] Total calculation: `(servicesSum + productsSum) - discount + tax` with HALF_UP rounding
- [x] Confirmation dialog before delivery note creation ("Una vez creada, el remito no se podrá editar")
- [x] deliveryNotes linked to repair orders navigate to repair order detail on row click

### 8.4 Testing

- [x] `DeliveryNoteServiceImplTest` — all service layer test methods (create, createFromEstimate, TEMPORAL client, delete restrictions, calculateTotal, markAsPaid)
- [x] `DeliveryNoteControllerTest` (if applicable) — controller layer tests
- [x] `DeliveryNoteMapperTest` (if applicable) — mapper tests
- [x] `DeliveryNoteList.test.tsx` — grid rendering, actions, delete disabled for repair order deliveryNotes
- [x] `DeliveryNoteDetail.test.tsx` — (N/A) DeliveryNoteDataTab merged into DeliveryNoteDetail; tested via DeliveryNoteTab test
- [x] `DeliveryNoteDataTab.test.tsx` — (N/A) merged into DeliveryNoteDetail component
- [x] `ServicesGrid.test.tsx` — add/remove rows, catalog autocomplete, subtotal, readonly mode
- [x] `ProductsGrid.test.tsx` — add/remove rows, catalog autocomplete, quantity × price, subtotal, readonly mode
- [x] `DeliveryNoteSummary.test.tsx` — subtotal, discount/tax clamping, final price, readonly mode
- [x] `DeliveryNoteTab.test.tsx` — renders inside repair order, create/load behavior
- [x] `PaymentsTabPlaceholder.test.tsx` — renders placeholder text "Próximamente"
