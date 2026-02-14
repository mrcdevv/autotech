# 09 — Facturación (Invoices)

## 1. Overview

This feature implements full management for **Invoices (Facturas)** — documents that record the final billing for services and products provided to a client's vehicle. Invoices can be created as **standalone** (from the `/facturas` list), **within a repair order** (from the "Factura" tab in repair order detail, replacing the placeholder from spec 06), or **pre-loaded from an approved estimate** (via the "Facturar" action in spec 08).

Key capabilities:
- Create invoices with nested line items (services and products), snapshotted at creation time.
- Status workflow: `PENDIENTE` → `PAGADA` (auto-transitions when total payments equal the invoice total; see spec 10 for payment details).
- **Immutable after creation**: once an invoice is created, its data (client, vehicle, line items, discount, tax, total) cannot be edited.
- Integration with the **Services** and **Products** catalogs via autocomplete (names and prices are **snapshotted** — copied by value at creation time, not FK references).
- "Factura anónima" support: for **TEMPORAL** clients, only products are allowed (no services). The client must exist in the system (created with type `TEMPORAL` — name + phone only).
- Pre-loading from an **ACEPTADO** estimate: copies client, vehicle, repair order, services, products, discount, and tax into the invoice creation form.
- Download / print invoice.
- Summary calculation: subtotals for services and products, discount %, tax %, and final price.
- Two-tab detail view: **Datos de la Factura** (invoice data) and **Pagos** (payments, handled by spec 10).

**Dependencies**: Clients (spec 02), Vehicles (spec 03), Services & Products catalog (spec 04), Repair Orders (spec 06), Estimates (spec 08), Payments (spec 10).

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/facturacion` |
| Base | `develop` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add Invoice, InvoiceServiceItem, InvoiceProduct entities`
- `feat: add invoice CRUD endpoints`
- `feat: add InvoicesPage with DataGrid`
- `feat: add InvoiceDetailPage with invoice data and payments tabs`
- `feat: add InvoiceTab component for repair order detail`
- `feat: add createFromEstimate pre-loading logic`
- `feat: add TEMPORAL client restriction (products only)`
- `test: add unit tests for InvoiceService`

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. No new migration needed.

### 3.1 `invoices`

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

**Indexes**: `idx_invoices_client_id`, `idx_invoices_repair_order_id`.

### 3.2 `invoice_services`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `invoice_id` | `BIGINT` | NOT NULL, FK → `invoices(id)` ON DELETE CASCADE |
| `service_name` | `VARCHAR(255)` | NOT NULL |
| `price` | `NUMERIC(12,2)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_invoice_services_invoice_id`.

### 3.3 `invoice_products`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `invoice_id` | `BIGINT` | NOT NULL, FK → `invoices(id)` ON DELETE CASCADE |
| `product_name` | `VARCHAR(255)` | NOT NULL |
| `quantity` | `INTEGER` | NOT NULL |
| `unit_price` | `NUMERIC(12,2)` | NOT NULL |
| `total_price` | `NUMERIC(12,2)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Index**: `idx_invoice_products_invoice_id`.

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.invoice/
├── controller/
│   └── InvoiceController.java
├── service/
│   ├── InvoiceService.java               (interface)
│   └── InvoiceServiceImpl.java           (implementation)
├── repository/
│   ├── InvoiceRepository.java
│   ├── InvoiceServiceItemRepository.java
│   └── InvoiceProductRepository.java
├── model/
│   ├── Invoice.java
│   ├── InvoiceStatus.java                (enum)
│   ├── InvoiceServiceItem.java
│   └── InvoiceProduct.java
└── dto/
    ├── InvoiceRequest.java
    ├── InvoiceServiceItemRequest.java
    ├── InvoiceProductRequest.java
    ├── InvoiceResponse.java
    ├── InvoiceDetailResponse.java
    ├── InvoiceServiceItemResponse.java
    ├── InvoiceProductResponse.java
    └── InvoiceMapper.java
```

> **Naming rationale**: The line-item entity is named `InvoiceServiceItem` (not `InvoiceService`) to avoid clashing with the service-layer interface `InvoiceService`.

---

### 4.2 Enum — `InvoiceStatus`

```java
package com.autotech.invoice.model;

public enum InvoiceStatus {
    PENDIENTE,
    PAGADA
}
```

---

### 4.3 Entities

#### `Invoice`

```java
@Entity
@Table(name = "invoices")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class Invoice extends BaseEntity {

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
    private InvoiceStatus status = InvoiceStatus.PENDIENTE;

    @OneToMany(mappedBy = "invoice", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceServiceItem> services = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceProduct> products = new ArrayList<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Invoice other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

#### `InvoiceServiceItem`

```java
@Entity
@Table(name = "invoice_services")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class InvoiceServiceItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "service_name", nullable = false, length = 255)
    private String serviceName;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof InvoiceServiceItem other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

#### `InvoiceProduct`

```java
@Entity
@Table(name = "invoice_products")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class InvoiceProduct extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

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
        if (!(o instanceof InvoiceProduct other)) return false;
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

#### `InvoiceRepository`

```java
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder", "estimate"})
    Optional<Invoice> findWithDetailsById(Long id);

    Optional<Invoice> findByRepairOrderId(Long repairOrderId);

    Optional<Invoice> findByEstimateId(Long estimateId);

    @EntityGraph(attributePaths = {"services", "products", "client", "vehicle", "repairOrder", "estimate"})
    Page<Invoice> findAll(Pageable pageable);

    @Query("""
        SELECT i FROM Invoice i
        LEFT JOIN i.client c
        LEFT JOIN i.vehicle v
        WHERE (:clientName IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :clientName, '%'))
               OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :clientName, '%')))
        AND (:plate IS NULL OR LOWER(v.plate) LIKE LOWER(CONCAT('%', :plate, '%')))
        AND (:status IS NULL OR i.status = :status)
    """)
    Page<Invoice> search(
            @Param("clientName") String clientName,
            @Param("plate") String plate,
            @Param("status") InvoiceStatus status,
            Pageable pageable);
}
```

#### `InvoiceServiceItemRepository`

```java
@Repository
public interface InvoiceServiceItemRepository extends JpaRepository<InvoiceServiceItem, Long> {

    List<InvoiceServiceItem> findByInvoiceId(Long invoiceId);

    void deleteByInvoiceId(Long invoiceId);
}
```

#### `InvoiceProductRepository`

```java
@Repository
public interface InvoiceProductRepository extends JpaRepository<InvoiceProduct, Long> {

    List<InvoiceProduct> findByInvoiceId(Long invoiceId);

    void deleteByInvoiceId(Long invoiceId);
}
```

---

### 4.5 DTOs

#### Request DTOs

```java
public record InvoiceServiceItemRequest(
        @NotBlank(message = "El nombre del servicio es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String serviceName,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "El precio debe tener como máximo 10 dígitos enteros y 2 decimales")
        BigDecimal price
) {}

public record InvoiceProductRequest(
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

public record InvoiceRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long clientId,

        Long vehicleId,            // nullable — not required for TEMPORAL client invoices

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
        List<InvoiceServiceItemRequest> services,

        @Valid
        List<InvoiceProductRequest> products
) {}
```

#### Response DTOs

```java
public record InvoiceServiceItemResponse(
        Long id,
        String serviceName,
        BigDecimal price
) {}

public record InvoiceProductResponse(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}

// Used in the list view (InvoicesPage grid)
public record InvoiceResponse(
        Long id,
        Long clientId,
        String clientFullName,
        Long vehicleId,
        String vehiclePlate,
        String vehicleModel,
        Long repairOrderId,
        Long estimateId,
        InvoiceStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

// Used in the detail view (InvoiceDetailPage / InvoiceTab)
public record InvoiceDetailResponse(
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
        InvoiceStatus status,
        BigDecimal discountPercentage,
        BigDecimal taxPercentage,
        BigDecimal total,
        List<InvoiceServiceItemResponse> services,
        List<InvoiceProductResponse> products,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

---

### 4.6 Mapper — `InvoiceMapper`

```java
@Mapper(componentModel = "spring")
public interface InvoiceMapper {

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFullName", expression = "java(entity.getClient().getFirstName() + \" \" + entity.getClient().getLastName())")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehiclePlate", source = "vehicle.plate")
    @Mapping(target = "vehicleModel", source = "vehicle.model")
    @Mapping(target = "repairOrderId", source = "repairOrder.id")
    @Mapping(target = "estimateId", source = "estimate.id")
    InvoiceResponse toResponse(Invoice entity);

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
    InvoiceDetailResponse toDetailResponse(Invoice entity);

    InvoiceServiceItemResponse toServiceItemResponse(InvoiceServiceItem entity);

    InvoiceProductResponse toProductResponse(InvoiceProduct entity);

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
    Invoice toEntity(InvoiceRequest request);
}
```

---

### 4.7 Service — `InvoiceService`

#### Interface

```java
public interface InvoiceService {

    Page<InvoiceResponse> getAll(Pageable pageable);

    Page<InvoiceResponse> search(String clientName, String plate, InvoiceStatus status, Pageable pageable);

    InvoiceDetailResponse getById(Long id);

    InvoiceDetailResponse getByRepairOrderId(Long repairOrderId);

    InvoiceDetailResponse create(InvoiceRequest request);

    InvoiceDetailResponse createFromEstimate(Long estimateId);

    void delete(Long id);

    BigDecimal calculateTotal(List<InvoiceServiceItemRequest> services,
                              List<InvoiceProductRequest> products,
                              BigDecimal discountPercentage,
                              BigDecimal taxPercentage);

    void markAsPaid(Long id);
}
```

#### Implementation — `InvoiceServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceMapper invoiceMapper;
    private final ClientRepository clientRepository;           // from client module
    private final VehicleRepository vehicleRepository;         // from vehicle module
    private final RepairOrderRepository repairOrderRepository; // from repairorder module
    private final EstimateService estimateService;             // from estimate module (interface)

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getAll(Pageable pageable) {
        log.debug("Fetching all invoices");
        return invoiceRepository.findAll(pageable)
                .map(invoiceMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> search(String clientName, String plate, InvoiceStatus status, Pageable pageable) {
        log.debug("Searching invoices - clientName: '{}', plate: '{}', status: '{}'", clientName, plate, status);
        return invoiceRepository.search(clientName, plate, status, pageable)
                .map(invoiceMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDetailResponse getById(Long id) {
        log.debug("Fetching invoice with id {}", id);
        Invoice entity = invoiceRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        return invoiceMapper.toDetailResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDetailResponse getByRepairOrderId(Long repairOrderId) {
        log.debug("Fetching invoice for repair order {}", repairOrderId);
        Invoice entity = invoiceRepository.findByRepairOrderId(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for RepairOrder", repairOrderId));
        return invoiceMapper.toDetailResponse(entity);
    }

    @Override
    @Transactional
    public InvoiceDetailResponse create(InvoiceRequest request) {
        // 1. Resolve client
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));

        // 2. Validate TEMPORAL client restriction: only products allowed (no services)
        if (client.getClientType() == ClientType.TEMPORAL) {
            if (request.services() != null && !request.services().isEmpty()) {
                throw new BusinessRuleException(
                        "Los clientes temporales solo pueden tener facturas de productos, no de servicios");
            }
        }

        // 3. Optionally resolve vehicle (nullable for TEMPORAL client invoices)
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
        Invoice entity = invoiceMapper.toEntity(request);
        entity.setClient(client);
        entity.setVehicle(vehicle);
        entity.setRepairOrder(repairOrder);
        entity.setEstimate(estimate);
        entity.setStatus(InvoiceStatus.PENDIENTE);

        // 7. Add child entities (snapshot line items)
        addChildEntities(entity, request);

        // 8. Calculate and set total
        BigDecimal total = calculateTotal(request.services(), request.products(),
                request.discountPercentage(), request.taxPercentage());
        entity.setTotal(total);

        // 9. Save
        Invoice saved = invoiceRepository.save(entity);
        log.info("Created invoice with id {}", saved.getId());
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public InvoiceDetailResponse createFromEstimate(Long estimateId) {
        // 1. Get estimate invoice data (validates ACEPTADO status)
        EstimateInvoiceDataResponse estimateData = estimateService.convertToInvoiceData(estimateId);

        // 2. Map estimate line items to invoice request DTOs
        List<InvoiceServiceItemRequest> services = estimateData.services().stream()
                .map(s -> new InvoiceServiceItemRequest(s.serviceName(), s.price()))
                .toList();

        List<InvoiceProductRequest> products = estimateData.products().stream()
                .map(p -> new InvoiceProductRequest(p.productName(), p.quantity(), p.unitPrice()))
                .toList();

        // 3. Build invoice request from estimate data
        InvoiceRequest request = new InvoiceRequest(
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
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));

        // Cannot delete invoices linked to a repair order
        if (invoice.getRepairOrder() != null) {
            throw new BusinessRuleException(
                    "No se puede eliminar una factura asociada a una orden de trabajo");
        }

        // Cannot delete paid invoices
        if (invoice.getStatus() == InvoiceStatus.PAGADA) {
            throw new BusinessRuleException("No se puede eliminar una factura que ya fue pagada");
        }

        invoiceRepository.deleteById(id);
        log.info("Deleted invoice with id {}", id);
    }

    @Override
    public BigDecimal calculateTotal(List<InvoiceServiceItemRequest> services,
                                     List<InvoiceProductRequest> products,
                                     BigDecimal discountPercentage,
                                     BigDecimal taxPercentage) {
        BigDecimal servicesTotal = BigDecimal.ZERO;
        if (services != null) {
            for (InvoiceServiceItemRequest svc : services) {
                servicesTotal = servicesTotal.add(svc.price());
            }
        }
        BigDecimal productsTotal = BigDecimal.ZERO;
        if (products != null) {
            for (InvoiceProductRequest prod : products) {
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
        Invoice entity = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        entity.setStatus(InvoiceStatus.PAGADA);
        invoiceRepository.save(entity);
        log.info("Marked invoice {} as PAGADA", id);
    }

    // --- Private helpers ---

    private void addChildEntities(Invoice entity, InvoiceRequest request) {
        if (request.services() != null) {
            for (InvoiceServiceItemRequest svcReq : request.services()) {
                InvoiceServiceItem svc = InvoiceServiceItem.builder()
                        .invoice(entity)
                        .serviceName(svcReq.serviceName())
                        .price(svcReq.price())
                        .build();
                entity.getServices().add(svc);
            }
        }
        if (request.products() != null) {
            for (InvoiceProductRequest prodReq : request.products()) {
                InvoiceProduct prod = InvoiceProduct.builder()
                        .invoice(entity)
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

### 4.8 Controller — `InvoiceController`

Base path: `/api/invoices`

```java
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    // GET /api/invoices?clientName={}&plate={}&status={}&page=0&size=12&sort=createdAt,desc
    @GetMapping
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> getAll(
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) InvoiceStatus status,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (clientName != null || plate != null || status != null) {
            return ResponseEntity.ok(ApiResponse.success(invoiceService.search(clientName, plate, status, pageable)));
        }
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getAll(pageable)));
    }

    // GET /api/invoices/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getById(id)));
    }

    // POST /api/invoices
    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceDetailResponse>> create(
            @Valid @RequestBody InvoiceRequest request) {
        InvoiceDetailResponse created = invoiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Factura creada", created));
    }

    // POST /api/invoices/from-estimate/{estimateId}
    @PostMapping("/from-estimate/{estimateId}")
    public ResponseEntity<ApiResponse<InvoiceDetailResponse>> createFromEstimate(
            @PathVariable Long estimateId) {
        InvoiceDetailResponse created = invoiceService.createFromEstimate(estimateId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Factura creada desde presupuesto", created));
    }

    // DELETE /api/invoices/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        invoiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Factura eliminada", null));
    }
}
```

### 4.9 Repair Order Integration

Add an endpoint in `RepairOrderController` to access the invoice for a specific repair order:

```
GET /api/repair-orders/{id}/invoice
```

```java
// In RepairOrderController (existing controller, add this endpoint)

@GetMapping("/{id}/invoice")
public ResponseEntity<ApiResponse<InvoiceDetailResponse>> getInvoiceByRepairOrder(@PathVariable Long id) {
    return ResponseEntity.ok(ApiResponse.success(invoiceService.getByRepairOrderId(id)));
}
```

The `RepairOrderService` injects `InvoiceService` to coordinate, as per the cross-module orchestration pattern.

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/invoices?clientName=&plate=&status=&page=0&size=12&sort=createdAt,desc` | List/search invoices (paginated, sortable by date) |
| `GET` | `/api/invoices/{id}` | Get invoice detail by ID |
| `POST` | `/api/invoices` | Create new invoice |
| `POST` | `/api/invoices/from-estimate/{estimateId}` | Create invoice pre-loaded from accepted estimate |
| `DELETE` | `/api/invoices/{id}` | Delete invoice (only standalone, not paid) |
| `GET` | `/api/repair-orders/{id}/invoice` | Get invoice linked to a repair order |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   └── invoices.ts
├── features/
│   └── invoices/
│       ├── components/
│       │   ├── InvoiceList.tsx
│       │   ├── InvoiceDetail.tsx
│       │   ├── InvoiceDataTab.tsx
│       │   ├── PaymentsTabPlaceholder.tsx
│       │   ├── ServicesGrid.tsx
│       │   ├── ProductsGrid.tsx
│       │   ├── InvoiceSummary.tsx
│       │   └── InvoiceTab.tsx              ← for repair order detail
│       └── hooks/
│           ├── useInvoices.ts
│           └── useInvoice.ts
├── pages/
│   ├── InvoicesPage.tsx
│   └── InvoiceDetailPage.tsx
└── types/
    └── invoice.ts
```

---

### 5.2 Types (`src/types/invoice.ts`)

```ts
// ---- Invoice Status ----

export type InvoiceStatus = "PENDIENTE" | "PAGADA";

// ---- Service Line Item ----

export interface InvoiceServiceItemRequest {
  serviceName: string;
  price: number;
}

export interface InvoiceServiceItemResponse {
  id: number;
  serviceName: string;
  price: number;
}

// ---- Product Line Item ----

export interface InvoiceProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceProductResponse {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ---- Invoice ----

export interface InvoiceRequest {
  clientId: number;
  vehicleId: number | null;
  repairOrderId: number | null;
  estimateId: number | null;
  discountPercentage: number;
  taxPercentage: number;
  services: InvoiceServiceItemRequest[];
  products: InvoiceProductRequest[];
}

// List view row
export interface InvoiceResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  vehicleId: number | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  repairOrderId: number | null;
  estimateId: number | null;
  status: InvoiceStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  createdAt: string;
  updatedAt: string;
}

// Detail view
export interface InvoiceDetailResponse {
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
  status: InvoiceStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  services: InvoiceServiceItemResponse[];
  products: InvoiceProductResponse[];
  createdAt: string;
  updatedAt: string;
}
```

---

### 5.3 API Layer (`src/api/invoices.ts`)

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Page } from "@/types/pagination";
import type {
  InvoiceResponse,
  InvoiceDetailResponse,
  InvoiceRequest,
  InvoiceStatus,
} from "@/types/invoice";

export const invoicesApi = {
  getAll: (params: {
    clientName?: string;
    plate?: string;
    status?: InvoiceStatus;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    apiClient.get<ApiResponse<Page<InvoiceResponse>>>("/invoices", {
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
    apiClient.get<ApiResponse<InvoiceDetailResponse>>(`/invoices/${id}`),

  getByRepairOrderId: (repairOrderId: number) =>
    apiClient.get<ApiResponse<InvoiceDetailResponse>>(
      `/repair-orders/${repairOrderId}/invoice`
    ),

  create: (data: InvoiceRequest) =>
    apiClient.post<ApiResponse<InvoiceDetailResponse>>("/invoices", data),

  createFromEstimate: (estimateId: number) =>
    apiClient.post<ApiResponse<InvoiceDetailResponse>>(
      `/invoices/from-estimate/${estimateId}`
    ),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/invoices/${id}`),
};
```

---

### 5.4 Hooks

#### `src/features/invoices/hooks/useInvoices.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { invoicesApi } from "@/api/invoices";
import type { InvoiceResponse, InvoiceStatus } from "@/types/invoice";

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [clientName, setClientName] = useState<string | undefined>(undefined);
  const [plate, setPlate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<InvoiceStatus | undefined>(undefined);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoicesApi.getAll({
        clientName,
        plate,
        status,
        page,
        size: pageSize,
      });
      setInvoices(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch (err) {
      setError("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, [clientName, plate, status, page, pageSize]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const deleteInvoice = async (id: number) => {
    await invoicesApi.delete(id);
    fetchInvoices();
  };

  return {
    invoices,
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
    deleteInvoice,
    refetch: fetchInvoices,
  };
}
```

#### `src/features/invoices/hooks/useInvoice.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { invoicesApi } from "@/api/invoices";
import type {
  InvoiceDetailResponse,
  InvoiceRequest,
} from "@/types/invoice";

export function useInvoice(id?: number, repairOrderId?: number) {
  const [invoice, setInvoice] = useState<InvoiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!id && !repairOrderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (id) {
        const res = await invoicesApi.getById(id);
        setInvoice(res.data.data);
      } else if (repairOrderId) {
        const res = await invoicesApi.getByRepairOrderId(repairOrderId);
        setInvoice(res.data.data);
      }
    } catch (err) {
      setError("Error al cargar la factura");
    } finally {
      setLoading(false);
    }
  }, [id, repairOrderId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const createInvoice = async (data: InvoiceRequest) => {
    const res = await invoicesApi.create(data);
    setInvoice(res.data.data);
    return res.data.data;
  };

  const createFromEstimate = async (estimateId: number) => {
    const res = await invoicesApi.createFromEstimate(estimateId);
    setInvoice(res.data.data);
    return res.data.data;
  };

  return {
    invoice,
    loading,
    error,
    createInvoice,
    createFromEstimate,
    refetch: fetchInvoice,
  };
}
```

---

### 5.5 Pages

#### `InvoicesPage` — route: `/facturas`

**UI Layout:**
- Page title: **"Facturas"**
- Filter bar:
  - `TextField` with placeholder: "Buscar por nombre de cliente o patente..."
  - `Select` for status: Todos, Pendiente, Pagada
- `Button` "Crear nueva factura" → navigates to `/facturas/nueva`
- `InvoiceList` DataGrid component (see below)

```tsx
// src/pages/InvoicesPage.tsx
export default function InvoicesPage() {
  const {
    invoices, loading, error, totalCount,
    page, setPage, pageSize, setPageSize,
    clientName, setClientName, plate, setPlate,
    status, setStatus, deleteInvoice,
  } = useInvoices();

  const navigate = useNavigate();

  const handleRowClick = (row: InvoiceResponse) => {
    if (row.repairOrderId != null) {
      // Navigate to repair order detail, "Factura" tab
      navigate(`/ordenes-trabajo/${row.repairOrderId}?tab=factura`);
    } else {
      navigate(`/facturas/${row.id}`);
    }
  };
  const handleCreate = () => navigate("/facturas/nueva");

  return (
    <Box>
      <Typography variant="h4">Facturas</Typography>
      <Box /* filter bar */>
        <TextField placeholder="Buscar por nombre de cliente..." onChange={...} />
        <TextField placeholder="Buscar por patente..." onChange={...} />
        <Select value={status ?? ""} onChange={...}>
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="PENDIENTE">Pendiente</MenuItem>
          <MenuItem value="PAGADA">Pagada</MenuItem>
        </Select>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Crear nueva factura
        </Button>
      </Box>
      <InvoiceList
        rows={invoices}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRowClick={handleRowClick}
        onDelete={deleteInvoice}
      />
    </Box>
  );
}
```

#### `InvoiceDetailPage` — route: `/facturas/:id` and `/facturas/nueva`

```tsx
// src/pages/InvoiceDetailPage.tsx
export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const estimateId = searchParams.get("estimateId")
    ? Number(searchParams.get("estimateId"))
    : undefined;

  const isNew = id === "nueva";
  const invoiceId = isNew ? undefined : Number(id);

  // Uses useInvoice hook to fetch existing or start with empty state
  // If estimateId is present, pre-loads from estimate via estimatesApi.getInvoiceData(estimateId)
  return <InvoiceDetail invoiceId={invoiceId} estimateId={estimateId} />;
}
```

---

### 5.6 Components

#### `InvoiceList` (`src/features/invoices/components/InvoiceList.tsx`)

Uses MUI `DataGrid` from `@mui/x-data-grid`.

```tsx
interface InvoiceListProps {
  rows: InvoiceResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (row: InvoiceResponse) => void;
  onDelete: (id: number) => void;
}

export function InvoiceList({ ... }: InvoiceListProps) {
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
            <Tooltip title={isFromRepairOrder ? "No se puede eliminar una factura de orden de trabajo" : "Eliminar"}>
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

#### `InvoiceDetail` (`src/features/invoices/components/InvoiceDetail.tsx`)

The main detail component, used both from `InvoiceDetailPage` and `InvoiceTab`.

```tsx
interface InvoiceDetailProps {
  invoiceId?: number;        // undefined = create mode
  repairOrderId?: number;    // set when rendered inside repair order tab
  estimateId?: number;       // set when pre-loading from an estimate
}

export function InvoiceDetail({ invoiceId, repairOrderId, estimateId }: InvoiceDetailProps) {
  const { invoice, loading, error, createInvoice, createFromEstimate } =
    useInvoice(invoiceId, repairOrderId);

  const [activeTab, setActiveTab] = useState(0);
  const isCreateMode = !invoiceId && !invoice;

  // If estimateId provided, pre-load data from estimate via estimatesApi.getInvoiceData(estimateId)
  // This populates the form with services, products, discount, tax, client, vehicle

  return (
    <Box>
      <Typography variant="h4">
        {isCreateMode ? "Nueva Factura" : `Factura #${invoice?.id}`}
      </Typography>

      {/* Download button (only in view mode) */}
      {!isCreateMode && (
        <Button startIcon={<DownloadIcon />} onClick={() => window.print()}>
          Descargar factura
        </Button>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Datos de la Factura" />
        <Tab label="Pagos" disabled={isCreateMode} />
      </Tabs>

      {activeTab === 0 && (
        <InvoiceDataTab
          invoice={invoice}
          isCreateMode={isCreateMode}
          estimateId={estimateId}
          onSubmit={createInvoice}
        />
      )}

      {activeTab === 1 && (
        <PaymentsTabPlaceholder invoiceId={invoice?.id} />
      )}
    </Box>
  );
}
```

#### `InvoiceDataTab` (`src/features/invoices/components/InvoiceDataTab.tsx`)

Contains the invoice form content for the first tab.

```tsx
interface InvoiceDataTabProps {
  invoice: InvoiceDetailResponse | null;
  isCreateMode: boolean;
  estimateId?: number;
  onSubmit: (data: InvoiceRequest) => Promise<InvoiceDetailResponse>;
}

export function InvoiceDataTab({ invoice, isCreateMode, estimateId, onSubmit }: InvoiceDataTabProps) {
  // State for form fields
  const [clientId, setClientId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [services, setServices] = useState<InvoiceServiceItemRequest[]>([]);
  const [products, setProducts] = useState<InvoiceProductRequest[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [isTemporalClient, setIsTemporalClient] = useState(false);

  // If estimateId → pre-load from estimate via estimatesApi.getInvoiceData(estimateId)
  // If viewing existing → populate from invoice prop (readonly)

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

  // --- InvoiceSummary ---
  <InvoiceSummary
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
      Crear factura
    </Button>
  )}

  // Confirmation dialog (MUI Dialog):
  // "¿Está seguro de que los datos son correctos? Una vez creada, la factura no se podrá editar."
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
- In **view mode** (existing invoice): all fields are readonly. Data is populated from the `invoice` prop.

#### `PaymentsTabPlaceholder` (`src/features/invoices/components/PaymentsTabPlaceholder.tsx`)

Temporary placeholder until spec 10 (Pagos) is implemented.

```tsx
interface PaymentsTabPlaceholderProps {
  invoiceId?: number;
}

export function PaymentsTabPlaceholder({ invoiceId }: PaymentsTabPlaceholderProps) {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Pagos — Próximamente
      </Typography>
      <Typography color="text.secondary">
        La gestión de pagos para esta factura estará disponible pronto.
      </Typography>
    </Box>
  );
}
```

> **Note**: This component will be fully replaced by spec 10 (Pagos) which implements the payment summary, cash payment modal, bank account payment modal, and payment history grid.

#### `ServicesGrid` (`src/features/invoices/components/ServicesGrid.tsx`)

```tsx
interface ServicesGridProps {
  services: InvoiceServiceItemRequest[];
  onChange: (services: InvoiceServiceItemRequest[]) => void;
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

#### `ProductsGrid` (`src/features/invoices/components/ProductsGrid.tsx`)

```tsx
interface ProductsGridProps {
  products: InvoiceProductRequest[];
  onChange: (products: InvoiceProductRequest[]) => void;
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

#### `InvoiceSummary` (`src/features/invoices/components/InvoiceSummary.tsx`)

```tsx
interface InvoiceSummaryProps {
  servicesSubtotal: number;
  productsSubtotal: number;
  discountPercentage: number;
  taxPercentage: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  readonly?: boolean;
}

export function InvoiceSummary({
  servicesSubtotal,
  productsSubtotal,
  discountPercentage,
  taxPercentage,
  onDiscountChange,
  onTaxChange,
  readonly = false,
}: InvoiceSummaryProps) {
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

#### `InvoiceTab` (`src/features/invoices/components/InvoiceTab.tsx`)

This component replaces the placeholder "Factura" tab in the repair order detail view (from spec 06).

```tsx
interface InvoiceTabProps {
  repairOrderId: number;
}

export function InvoiceTab({ repairOrderId }: InvoiceTabProps) {
  const { invoice, loading, error, createInvoice } = useInvoice(undefined, repairOrderId);

  if (loading) return <CircularProgress />;
  if (error && !invoice) {
    // No invoice yet — show creation form
    return <InvoiceDetail repairOrderId={repairOrderId} />;
  }

  // Invoice exists — show detail view (readonly data tab + payments tab)
  return <InvoiceDetail invoiceId={invoice?.id} repairOrderId={repairOrderId} />;
}
```

**Integration with Repair Order Detail:**

In `RepairOrderDetailPage`, replace the placeholder `<Typography>Próximamente</Typography>` for the "Factura" tab with:

```tsx
{activeTab === 4 && <InvoiceTab repairOrderId={repairOrderId} />}
```

---

### 5.7 Routes

Add the following routes to `src/routes/`:

```tsx
import { lazy } from "react";

const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("@/pages/InvoiceDetailPage"));

// Route definitions
{ path: "/facturas", element: <InvoicesPage /> }
{ path: "/facturas/nueva", element: <InvoiceDetailPage /> }
{ path: "/facturas/:id", element: <InvoiceDetailPage /> }
```

---

## 6. Business Rules

### 6.1 Immutability After Creation

Once an invoice is created, its data cannot be edited. This includes:
- Client and vehicle information
- Services and products line items (names, quantities, prices)
- Discount and tax percentages
- Total amount

The only mutable field is `status`, which transitions from `PENDIENTE` to `PAGADA` automatically when total payments equal the invoice total (handled by spec 10 — Pagos).

**UI enforcement**: In view mode (`isCreateMode = false`), all form fields, grids, and summary fields are rendered as `readonly` / `disabled`.

**Backend enforcement**: There is no `PUT /api/invoices/{id}` endpoint. The only write operations are `POST` (create) and `DELETE` (delete, with restrictions).

### 6.2 TEMPORAL Client Restriction (Factura Anónima)

When the selected client has `clientType = "TEMPORAL"`:
- **Only products are allowed** — the services grid is hidden/disabled.
- The invoice request must have an empty `services` list. If non-empty, the backend throws a `BusinessRuleException` with message: `"Los clientes temporales solo pueden tener facturas de productos, no de servicios"`.
- Vehicle is **optional** for TEMPORAL clients (the DB column `vehicle_id` is nullable).
- The TEMPORAL client must already exist in the system (created via the client creation form with type `TEMPORAL` — only name + phone required).

**UI flow**: When a TEMPORAL client is selected from the dropdown, the `ServicesGrid` component is hidden and the vehicle `Autocomplete` becomes optional.

### 6.3 Estimate Pre-Loading

When creating an invoice from an approved estimate (via the "Facturar" action in spec 08):

1. The user clicks "Facturar" on an `ACEPTADO` estimate → navigates to `/facturas/nueva?estimateId={id}`.
2. The `InvoiceDetailPage` reads the `estimateId` query parameter.
3. On mount, calls `GET /api/estimates/{id}/invoice-data` to get the `EstimateInvoiceDataResponse`.
4. Pre-populates the invoice creation form with: `clientId`, `vehicleId`, `repairOrderId`, services, products, discount %, tax %.
5. The user can review and modify the pre-loaded data before confirming creation.
6. On submit, sends `POST /api/invoices` with the `estimateId` field set to link the invoice to the estimate.

Alternatively, the backend endpoint `POST /api/invoices/from-estimate/{estimateId}` can be used to create the invoice directly from the estimate data without user modification.

### 6.4 Snapshot Line Items

Service and product line items in invoices are **snapshots** — they copy the name and price values at creation time. They do not reference the services/products catalog tables via FK. If catalog prices change later, existing invoices are unaffected.

### 6.5 Status Auto-Update

The invoice `status` auto-transitions from `PENDIENTE` to `PAGADA` when the sum of all associated payments equals or exceeds the invoice `total`. This logic is handled by the payment module (spec 10), which calls `invoiceService.markAsPaid(invoiceId)` after each payment is recorded.

### 6.6 Deletion Restrictions

- **Cannot delete** invoices linked to a repair order (`repairOrderId != null`). The backend throws: `"No se puede eliminar una factura asociada a una orden de trabajo"`.
- **Cannot delete** invoices that have been fully paid (`status = PAGADA`). The backend throws: `"No se puede eliminar una factura que ya fue pagada"`.
- **UI enforcement**: In the `InvoiceList` grid, the delete action button is disabled for invoices that came from a repair order. A tooltip explains the restriction.

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

#### `InvoiceServiceImplTest`

Use JUnit 5 + Mockito. Mock all repositories and the `EstimateService` interface.

```java
@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private InvoiceMapper invoiceMapper;
    @Mock private ClientRepository clientRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private RepairOrderRepository repairOrderRepository;
    @Mock private EstimateService estimateService;
}
```

**Test cases:**

| Method | Test | Description |
|---|---|---|
| `create` | `shouldCreateInvoiceSuccessfully` | Happy path: valid client, vehicle, services, products → returns `InvoiceDetailResponse` |
| `create` | `shouldThrowWhenClientNotFound` | Client ID does not exist → `ResourceNotFoundException` |
| `create` | `shouldThrowWhenTemporalClientHasServices` | TEMPORAL client with non-empty services list → `BusinessRuleException` |
| `create` | `shouldCreateInvoiceForTemporalClientWithProductsOnly` | TEMPORAL client with only products → success |
| `create` | `shouldCreateInvoiceWithNullVehicleForTemporalClient` | TEMPORAL client with null vehicleId → success |
| `create` | `shouldCreateInvoiceWithEstimateLink` | Request with estimateId set → invoice links to estimate |
| `createFromEstimate` | `shouldCreateInvoiceFromAcceptedEstimate` | ACEPTADO estimate → invoice pre-loaded from estimate data |
| `createFromEstimate` | `shouldThrowWhenEstimateNotAccepted` | Non-ACEPTADO estimate → `BusinessRuleException` from `estimateService.convertToInvoiceData` |
| `getById` | `shouldReturnInvoiceById` | Existing ID → returns detail response |
| `getById` | `shouldThrowWhenInvoiceNotFound` | Non-existing ID → `ResourceNotFoundException` |
| `getByRepairOrderId` | `shouldReturnInvoiceByRepairOrderId` | Existing repair order with invoice → returns detail response |
| `getByRepairOrderId` | `shouldThrowWhenNoInvoiceForRepairOrder` | Repair order without invoice → `ResourceNotFoundException` |
| `getAll` | `shouldReturnPaginatedInvoices` | Returns paginated list of `InvoiceResponse` |
| `search` | `shouldFilterByClientName` | Search by client name → filtered results |
| `search` | `shouldFilterByPlate` | Search by plate → filtered results |
| `search` | `shouldFilterByStatus` | Search by status → filtered results |
| `delete` | `shouldDeleteStandaloneInvoice` | Invoice without repair order, not paid → deleted |
| `delete` | `shouldThrowWhenDeletingRepairOrderInvoice` | Invoice with repairOrderId → `BusinessRuleException` |
| `delete` | `shouldThrowWhenDeletingPaidInvoice` | Invoice with status PAGADA → `BusinessRuleException` |
| `delete` | `shouldThrowWhenInvoiceNotFoundForDelete` | Non-existing ID → `ResourceNotFoundException` |
| `calculateTotal` | `shouldCalculateTotalCorrectly` | Services + products + discount + tax → correct total |
| `calculateTotal` | `shouldHandleZeroDiscountAndTax` | No discount, no tax → total = subtotal |
| `calculateTotal` | `shouldHandleEmptyServicesList` | No services, only products → correct total |
| `calculateTotal` | `shouldHandleEmptyProductsList` | No products, only services → correct total |
| `markAsPaid` | `shouldMarkInvoiceAsPaid` | Existing invoice → status set to PAGADA |
| `markAsPaid` | `shouldThrowWhenInvoiceNotFoundForMarkAsPaid` | Non-existing ID → `ResourceNotFoundException` |

### 7.2 Frontend — Component Tests

Use Vitest + React Testing Library.

**Test files:**

| Component | Test file | Key tests |
|---|---|---|
| `InvoiceList` | `InvoiceList.test.tsx` | Renders grid columns; handles empty state; calls `onRowClick`; disables delete for repair order invoices; calls `onDelete` for standalone invoices |
| `InvoiceDetail` | `InvoiceDetail.test.tsx` | Renders create mode with empty form; renders view mode with readonly fields; shows confirmation dialog on create; switches between tabs |
| `InvoiceDataTab` | `InvoiceDataTab.test.tsx` | Shows client/vehicle autocompletes in create mode; hides services grid for TEMPORAL clients; pre-loads estimate data; disables fields in view mode |
| `ServicesGrid` | `ServicesGrid.test.tsx` | Adds service row; removes service row; updates service name and price; shows subtotal; renders readonly |
| `ProductsGrid` | `ProductsGrid.test.tsx` | Adds product row; removes product row; updates quantity/price; calculates row total; shows subtotal; renders readonly |
| `InvoiceSummary` | `InvoiceSummary.test.tsx` | Calculates final price; clamps discount 0–100; clamps tax 0–100; renders readonly |
| `InvoiceTab` | `InvoiceTab.test.tsx` | Shows creation form when no invoice exists; shows detail view when invoice exists |
| `PaymentsTabPlaceholder` | `PaymentsTabPlaceholder.test.tsx` | Renders placeholder text "Próximamente" |
