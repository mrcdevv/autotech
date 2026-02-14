# 04 — Catálogo de Servicios, Productos y Trabajos Enlatados

## 1. Overview

This feature implements the **Services**, **Products**, and **Canned Jobs** catalog — configuration/reference data used later by estimates and invoices. Each entity is a standalone CRUD with no dependencies on other features.

- **Services**: labor items with a name, description, and optional price.
- **Products**: parts/materials with a name, description, stock quantity, and optional unit price.
- **Canned Jobs** (Trabajos enlatados): predefined bundles that group a set of services and products. They can be created from the config screen or from a repair order. When a canned job is applied to an estimate/invoice, the contained services and products are **snapshotted** (copied by value) — changes to the canned job do not retroactively affect existing estimates/invoices.

**No dependencies** on other modules. These are catalog items consumed downstream.

---

## 2. Git

- **Branch**: `feature/catalogo-servicios-productos`
- **Commits**: conventional commits (`feat:`, `test:`, `refactor:`, etc.)

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. No new migration needed.

### 3.1 `services`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(255)` | NOT NULL |
| `description` | `TEXT` | nullable |
| `price` | `NUMERIC(12,2)` | nullable |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.2 `products`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(255)` | NOT NULL |
| `description` | `TEXT` | nullable |
| `quantity` | `INTEGER` | NOT NULL DEFAULT 0 |
| `unit_price` | `NUMERIC(12,2)` | nullable |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.3 `canned_jobs`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `title` | `VARCHAR(255)` | NOT NULL |
| `description` | `TEXT` | nullable |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.4 `canned_job_services`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `canned_job_id` | `BIGINT` | FK → `canned_jobs(id)` ON DELETE CASCADE |
| `service_name` | `VARCHAR(255)` | NOT NULL |
| `price` | `NUMERIC(12,2)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.5 `canned_job_products`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `canned_job_id` | `BIGINT` | FK → `canned_jobs(id)` ON DELETE CASCADE |
| `product_name` | `VARCHAR(255)` | NOT NULL |
| `quantity` | `INTEGER` | NOT NULL |
| `unit_price` | `NUMERIC(12,2)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.catalog/
├── controller/
│   ├── CatalogServiceController.java
│   ├── ProductController.java
│   └── CannedJobController.java
├── service/
│   ├── CatalogServiceService.java          (interface)
│   ├── CatalogServiceServiceImpl.java      (implementation)
│   ├── ProductService.java                 (interface)
│   ├── ProductServiceImpl.java             (implementation)
│   ├── CannedJobService.java               (interface)
│   └── CannedJobServiceImpl.java           (implementation)
├── repository/
│   ├── CatalogServiceRepository.java
│   ├── ProductRepository.java
│   ├── CannedJobRepository.java
│   ├── CannedJobServiceRepository.java
│   └── CannedJobProductRepository.java
├── model/
│   ├── CatalogService.java
│   ├── Product.java
│   ├── CannedJob.java
│   ├── CannedJobService.java
│   └── CannedJobProduct.java
└── dto/
    ├── CatalogServiceRequest.java
    ├── CatalogServiceResponse.java
    ├── ProductRequest.java
    ├── ProductResponse.java
    ├── CannedJobRequest.java
    ├── CannedJobResponse.java
    ├── CannedJobDetailResponse.java
    ├── CannedJobServiceRequest.java
    ├── CannedJobServiceResponse.java
    ├── CannedJobProductRequest.java
    ├── CannedJobProductResponse.java
    ├── CatalogServiceMapper.java
    ├── ProductMapper.java
    └── CannedJobMapper.java
```

> **Naming rationale**: The entity is named `CatalogService` (not `Service`) to avoid clashing with Spring's `@Service` annotation. The service layer is `CatalogServiceService` — while awkward, it is unambiguous and follows the `{Entity}Service` convention consistently.

---

### 4.2 Entities

#### `CatalogService`

```java
@Entity
@Table(name = "services")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class CatalogService extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price;
}
```

#### `Product`

```java
@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class Product extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(name = "unit_price", precision = 12, scale = 2)
    private BigDecimal unitPrice;
}
```

#### `CannedJob`

```java
@Entity
@Table(name = "canned_jobs")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class CannedJob extends BaseEntity {

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "cannedJob", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CannedJobService> services = new ArrayList<>();

    @OneToMany(mappedBy = "cannedJob", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CannedJobProduct> products = new ArrayList<>();
}
```

#### `CannedJobService`

```java
@Entity
@Table(name = "canned_job_services")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class CannedJobService extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canned_job_id", nullable = false)
    private CannedJob cannedJob;

    @Column(name = "service_name", nullable = false, length = 255)
    private String serviceName;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
}
```

#### `CannedJobProduct`

```java
@Entity
@Table(name = "canned_job_products")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class CannedJobProduct extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canned_job_id", nullable = false)
    private CannedJob cannedJob;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;
}
```

---

### 4.3 Repositories

#### `CatalogServiceRepository`

```java
@Repository
public interface CatalogServiceRepository extends JpaRepository<CatalogService, Long> {

    Page<CatalogService> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String name, String description, Pageable pageable);
}
```

#### `ProductRepository`

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String name, String description, Pageable pageable);
}
```

#### `CannedJobRepository`

```java
@Repository
public interface CannedJobRepository extends JpaRepository<CannedJob, Long> {

    Page<CannedJob> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String title, String description, Pageable pageable);

    @EntityGraph(attributePaths = {"services", "products"})
    Optional<CannedJob> findWithDetailsById(Long id);
}
```

#### `CannedJobServiceRepository`

```java
@Repository
public interface CannedJobServiceRepository extends JpaRepository<CannedJobService, Long> {

    List<CannedJobService> findByCannedJobId(Long cannedJobId);

    void deleteByCannedJobId(Long cannedJobId);
}
```

#### `CannedJobProductRepository`

```java
@Repository
public interface CannedJobProductRepository extends JpaRepository<CannedJobProduct, Long> {

    List<CannedJobProduct> findByCannedJobId(Long cannedJobId);

    void deleteByCannedJobId(Long cannedJobId);
}
```

---

### 4.4 DTOs

#### Service DTOs

```java
public record CatalogServiceRequest(
        @NotBlank(message = "El nombre del servicio es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String name,

        @Size(max = 5000, message = "La descripción no puede superar los 5000 caracteres")
        String description,

        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "El precio debe tener como máximo 10 dígitos enteros y 2 decimales")
        BigDecimal price
) {}

public record CatalogServiceResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

#### Product DTOs

```java
public record ProductRequest(
        @NotBlank(message = "El nombre del producto es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String name,

        @Size(max = 5000, message = "La descripción no puede superar los 5000 caracteres")
        String description,

        @Min(value = 0, message = "La cantidad no puede ser negativa")
        Integer quantity,

        @DecimalMin(value = "0.00", message = "El precio unitario no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "El precio debe tener como máximo 10 dígitos enteros y 2 decimales")
        BigDecimal unitPrice
) {}

public record ProductResponse(
        Long id,
        String name,
        String description,
        Integer quantity,
        BigDecimal unitPrice,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

#### Canned Job DTOs

```java
public record CannedJobServiceRequest(
        @NotBlank(message = "El nombre del servicio es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String serviceName,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        @Digits(integer = 10, fraction = 2)
        BigDecimal price
) {}

public record CannedJobServiceResponse(
        Long id,
        String serviceName,
        BigDecimal price
) {}

public record CannedJobProductRequest(
        @NotBlank(message = "El nombre del producto es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String productName,

        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser al menos 1")
        Integer quantity,

        @NotNull(message = "El precio unitario es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio unitario no puede ser negativo")
        @Digits(integer = 10, fraction = 2)
        BigDecimal unitPrice
) {}

public record CannedJobProductResponse(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice
) {}

public record CannedJobRequest(
        @NotBlank(message = "El título del trabajo enlatado es obligatorio")
        @Size(max = 255, message = "El título no puede superar los 255 caracteres")
        String title,

        @Size(max = 5000, message = "La descripción no puede superar los 5000 caracteres")
        String description,

        @Valid
        List<CannedJobServiceRequest> services,

        @Valid
        List<CannedJobProductRequest> products
) {}

public record CannedJobResponse(
        Long id,
        String title,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

public record CannedJobDetailResponse(
        Long id,
        String title,
        String description,
        List<CannedJobServiceResponse> services,
        List<CannedJobProductResponse> products,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

---

### 4.5 Mappers

#### `CatalogServiceMapper`

```java
@Mapper(componentModel = "spring")
public interface CatalogServiceMapper {

    CatalogServiceResponse toResponse(CatalogService entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CatalogService toEntity(CatalogServiceRequest request);

    void updateEntity(CatalogServiceRequest request, @MappingTarget CatalogService entity);
}
```

#### `ProductMapper`

```java
@Mapper(componentModel = "spring")
public interface ProductMapper {

    ProductResponse toResponse(Product entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Product toEntity(ProductRequest request);

    void updateEntity(ProductRequest request, @MappingTarget Product entity);
}
```

#### `CannedJobMapper`

```java
@Mapper(componentModel = "spring")
public interface CannedJobMapper {

    CannedJobResponse toResponse(CannedJob entity);

    CannedJobDetailResponse toDetailResponse(CannedJob entity);

    CannedJobServiceResponse toServiceResponse(CannedJobService entity);

    CannedJobProductResponse toProductResponse(CannedJobProduct entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "services", ignore = true)
    @Mapping(target = "products", ignore = true)
    CannedJob toEntity(CannedJobRequest request);
}
```

---

### 4.6 Services

#### `CatalogServiceService` (interface)

```java
public interface CatalogServiceService {

    Page<CatalogServiceResponse> search(String query, Pageable pageable);

    CatalogServiceResponse getById(Long id);

    CatalogServiceResponse create(CatalogServiceRequest request);

    CatalogServiceResponse update(Long id, CatalogServiceRequest request);

    void delete(Long id);
}
```

#### `CatalogServiceServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogServiceServiceImpl implements CatalogServiceService {

    private final CatalogServiceRepository catalogServiceRepository;
    private final CatalogServiceMapper catalogServiceMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<CatalogServiceResponse> search(String query, Pageable pageable) {
        log.debug("Searching services with query: '{}'", query);
        if (query == null || query.isBlank()) {
            return catalogServiceRepository.findAll(pageable)
                    .map(catalogServiceMapper::toResponse);
        }
        return catalogServiceRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query, pageable)
                .map(catalogServiceMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CatalogServiceResponse getById(Long id) {
        log.debug("Fetching service with id {}", id);
        CatalogService entity = catalogServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        return catalogServiceMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public CatalogServiceResponse create(CatalogServiceRequest request) {
        CatalogService entity = catalogServiceMapper.toEntity(request);
        CatalogService saved = catalogServiceRepository.save(entity);
        log.info("Created service with id {}", saved.getId());
        return catalogServiceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CatalogServiceResponse update(Long id, CatalogServiceRequest request) {
        CatalogService entity = catalogServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        catalogServiceMapper.updateEntity(request, entity);
        CatalogService saved = catalogServiceRepository.save(entity);
        log.info("Updated service with id {}", saved.getId());
        return catalogServiceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!catalogServiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Service", id);
        }
        catalogServiceRepository.deleteById(id);
        log.info("Deleted service with id {}", id);
    }
}
```

#### `ProductService` (interface)

```java
public interface ProductService {

    Page<ProductResponse> search(String query, Pageable pageable);

    ProductResponse getById(Long id);

    ProductResponse create(ProductRequest request);

    ProductResponse update(Long id, ProductRequest request);

    void delete(Long id);
}
```

#### `ProductServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String query, Pageable pageable) {
        log.debug("Searching products with query: '{}'", query);
        if (query == null || query.isBlank()) {
            return productRepository.findAll(pageable)
                    .map(productMapper::toResponse);
        }
        return productRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query, pageable)
                .map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        log.debug("Fetching product with id {}", id);
        Product entity = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return productMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product entity = productMapper.toEntity(request);
        Product saved = productRepository.save(entity);
        log.info("Created product with id {}", saved.getId());
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product entity = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        productMapper.updateEntity(request, entity);
        Product saved = productRepository.save(entity);
        log.info("Updated product with id {}", saved.getId());
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", id);
        }
        productRepository.deleteById(id);
        log.info("Deleted product with id {}", id);
    }
}
```

#### `CannedJobService` (interface)

```java
public interface CannedJobService {

    Page<CannedJobResponse> search(String query, Pageable pageable);

    CannedJobDetailResponse getById(Long id);

    CannedJobDetailResponse create(CannedJobRequest request);

    CannedJobDetailResponse update(Long id, CannedJobRequest request);

    void delete(Long id);
}
```

#### `CannedJobServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class CannedJobServiceImpl implements CannedJobService {

    private final CannedJobRepository cannedJobRepository;
    private final CannedJobMapper cannedJobMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<CannedJobResponse> search(String query, Pageable pageable) {
        log.debug("Searching canned jobs with query: '{}'", query);
        if (query == null || query.isBlank()) {
            return cannedJobRepository.findAll(pageable)
                    .map(cannedJobMapper::toResponse);
        }
        return cannedJobRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query, pageable)
                .map(cannedJobMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CannedJobDetailResponse getById(Long id) {
        log.debug("Fetching canned job with id {}", id);
        CannedJob entity = cannedJobRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CannedJob", id));
        return cannedJobMapper.toDetailResponse(entity);
    }

    @Override
    @Transactional
    public CannedJobDetailResponse create(CannedJobRequest request) {
        CannedJob entity = cannedJobMapper.toEntity(request);
        addChildEntities(entity, request);
        CannedJob saved = cannedJobRepository.save(entity);
        log.info("Created canned job with id {}", saved.getId());
        return cannedJobMapper.toDetailResponse(saved);
    }

    @Override
    @Transactional
    public CannedJobDetailResponse update(Long id, CannedJobRequest request) {
        CannedJob entity = cannedJobRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CannedJob", id));

        entity.setTitle(request.title());
        entity.setDescription(request.description());

        // Replace children: clear existing, add new
        entity.getServices().clear();
        entity.getProducts().clear();
        addChildEntities(entity, request);

        CannedJob saved = cannedJobRepository.save(entity);
        log.info("Updated canned job with id {}", saved.getId());
        return cannedJobMapper.toDetailResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!cannedJobRepository.existsById(id)) {
            throw new ResourceNotFoundException("CannedJob", id);
        }
        cannedJobRepository.deleteById(id);
        log.info("Deleted canned job with id {}", id);
    }

    private void addChildEntities(CannedJob entity, CannedJobRequest request) {
        if (request.services() != null) {
            for (CannedJobServiceRequest svcReq : request.services()) {
                CannedJobService svc = CannedJobService.builder()
                        .cannedJob(entity)
                        .serviceName(svcReq.serviceName())
                        .price(svcReq.price())
                        .build();
                entity.getServices().add(svc);
            }
        }
        if (request.products() != null) {
            for (CannedJobProductRequest prodReq : request.products()) {
                CannedJobProduct prod = CannedJobProduct.builder()
                        .cannedJob(entity)
                        .productName(prodReq.productName())
                        .quantity(prodReq.quantity())
                        .unitPrice(prodReq.unitPrice())
                        .build();
                entity.getProducts().add(prod);
            }
        }
    }
}
```

---

### 4.7 Controllers

#### `CatalogServiceController`

```
GET    /api/services?query={query}&page={page}&size={size}&sort={sort}
GET    /api/services/{id}
POST   /api/services
PUT    /api/services/{id}
DELETE /api/services/{id}
```

```java
@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class CatalogServiceController {

    private final CatalogServiceService catalogServiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CatalogServiceResponse>>> search(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 12, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(catalogServiceService.search(query, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CatalogServiceResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(catalogServiceService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CatalogServiceResponse>> create(
            @Valid @RequestBody CatalogServiceRequest request) {
        CatalogServiceResponse created = catalogServiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Servicio creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CatalogServiceResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CatalogServiceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Servicio actualizado", catalogServiceService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        catalogServiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Servicio eliminado", null));
    }
}
```

#### `ProductController`

```
GET    /api/products?query={query}&page={page}&size={size}&sort={sort}
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

```java
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> search(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 12, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(productService.search(query, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @Valid @RequestBody ProductRequest request) {
        ProductResponse created = productService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Producto creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Producto actualizado", productService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Producto eliminado", null));
    }
}
```

#### `CannedJobController`

```
GET    /api/canned-jobs?query={query}&page={page}&size={size}&sort={sort}
GET    /api/canned-jobs/{id}
POST   /api/canned-jobs
PUT    /api/canned-jobs/{id}
DELETE /api/canned-jobs/{id}
```

```java
@RestController
@RequestMapping("/api/canned-jobs")
@RequiredArgsConstructor
public class CannedJobController {

    private final CannedJobService cannedJobService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CannedJobResponse>>> search(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 12, sort = "title") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(cannedJobService.search(query, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CannedJobDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(cannedJobService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CannedJobDetailResponse>> create(
            @Valid @RequestBody CannedJobRequest request) {
        CannedJobDetailResponse created = cannedJobService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Trabajo enlatado creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CannedJobDetailResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CannedJobRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Trabajo enlatado actualizado", cannedJobService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        cannedJobService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Trabajo enlatado eliminado", null));
    }
}
```

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   ├── catalogServices.ts
│   ├── products.ts
│   └── cannedJobs.ts
├── features/
│   └── catalog/
│       ├── components/
│       │   ├── ServicesDataGrid.tsx
│       │   ├── ProductsDataGrid.tsx
│       │   ├── CannedJobsDataGrid.tsx
│       │   └── CannedJobFormDialog.tsx
│       └── hooks/
│           ├── useCatalogServices.ts
│           ├── useProducts.ts
│           └── useCannedJobs.ts
├── pages/
│   ├── ServicesPage.tsx
│   ├── ProductsPage.tsx
│   └── CannedJobsPage.tsx
└── types/
    └── catalog.ts
```

---

### 5.2 Types (`src/types/catalog.ts`)

```ts
// ---- Services ----

export interface CatalogServiceResponse {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogServiceRequest {
  name: string;
  description: string | null;
  price: number | null;
}

// ---- Products ----

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number | null;
}

// ---- Canned Jobs ----

export interface CannedJobServiceResponse {
  id: number;
  serviceName: string;
  price: number;
}

export interface CannedJobServiceRequest {
  serviceName: string;
  price: number;
}

export interface CannedJobProductResponse {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CannedJobProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CannedJobResponse {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CannedJobDetailResponse {
  id: number;
  title: string;
  description: string | null;
  services: CannedJobServiceResponse[];
  products: CannedJobProductResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CannedJobRequest {
  title: string;
  description: string | null;
  services: CannedJobServiceRequest[];
  products: CannedJobProductRequest[];
}
```

---

### 5.3 API Layer

#### `src/api/catalogServices.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Page } from "@/types/pagination";
import type { CatalogServiceResponse, CatalogServiceRequest } from "@/types/catalog";

export const catalogServicesApi = {
  search: (query?: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<Page<CatalogServiceResponse>>>("/services", {
      params: { query, page, size, sort: "name,asc" },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<CatalogServiceResponse>>(`/services/${id}`),

  create: (data: CatalogServiceRequest) =>
    apiClient.post<ApiResponse<CatalogServiceResponse>>("/services", data),

  update: (id: number, data: CatalogServiceRequest) =>
    apiClient.put<ApiResponse<CatalogServiceResponse>>(`/services/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/services/${id}`),
};
```

#### `src/api/products.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Page } from "@/types/pagination";
import type { ProductResponse, ProductRequest } from "@/types/catalog";

export const productsApi = {
  search: (query?: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<Page<ProductResponse>>>("/products", {
      params: { query, page, size, sort: "name,asc" },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<ProductResponse>>(`/products/${id}`),

  create: (data: ProductRequest) =>
    apiClient.post<ApiResponse<ProductResponse>>("/products", data),

  update: (id: number, data: ProductRequest) =>
    apiClient.put<ApiResponse<ProductResponse>>(`/products/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/products/${id}`),
};
```

#### `src/api/cannedJobs.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Page } from "@/types/pagination";
import type {
  CannedJobResponse,
  CannedJobDetailResponse,
  CannedJobRequest,
} from "@/types/catalog";

export const cannedJobsApi = {
  search: (query?: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<Page<CannedJobResponse>>>("/canned-jobs", {
      params: { query, page, size, sort: "title,asc" },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<CannedJobDetailResponse>>(`/canned-jobs/${id}`),

  create: (data: CannedJobRequest) =>
    apiClient.post<ApiResponse<CannedJobDetailResponse>>("/canned-jobs", data),

  update: (id: number, data: CannedJobRequest) =>
    apiClient.put<ApiResponse<CannedJobDetailResponse>>(`/canned-jobs/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/canned-jobs/${id}`),
};
```

---

### 5.4 Hooks

#### `src/features/catalog/hooks/useCatalogServices.ts`

```ts
export function useCatalogServices() {
  const [services, setServices] = useState<CatalogServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [query, setQuery] = useState("");

  const fetchServices = useCallback(async () => { ... }, [query, page, pageSize]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const createService = async (data: CatalogServiceRequest) => { ... };
  const updateService = async (id: number, data: CatalogServiceRequest) => { ... };
  const deleteService = async (id: number) => { ... };

  return {
    services, loading, error, totalCount,
    page, setPage, pageSize, setPageSize,
    query, setQuery,
    createService, updateService, deleteService,
    refetch: fetchServices,
  };
}
```

#### `src/features/catalog/hooks/useProducts.ts`

```ts
export function useProducts() {
  // Same pattern as useCatalogServices, using productsApi
  // Returns: products, loading, error, totalCount, page, setPage, pageSize, setPageSize,
  //          query, setQuery, createProduct, updateProduct, deleteProduct, refetch
}
```

#### `src/features/catalog/hooks/useCannedJobs.ts`

```ts
export function useCannedJobs() {
  // List uses cannedJobsApi.search (returns CannedJobResponse[])
  // getById uses cannedJobsApi.getById (returns CannedJobDetailResponse)
  // Returns: cannedJobs, loading, error, totalCount, page, setPage, pageSize, setPageSize,
  //          query, setQuery, createCannedJob, updateCannedJob, deleteCannedJob, refetch
}
```

---

### 5.5 Pages & Components

#### `ServicesPage` — route: `/servicios`

**UI Layout:**
- Page title: **"Servicios"**
- Search `TextField` with placeholder: "Buscar por nombre o descripción..."
- `Button` "Agregar servicio" → adds a new empty row
- `DataGrid` (MUI X) with inline editing:
  - Columns: `Nombre` (editable), `Descripción` (editable), `Precio` (editable, numeric), `Acciones` (delete icon button)
  - Pagination: server-side, 12 rows per page
  - `processRowUpdate` handler saves via API on cell edit commit
  - New rows are created via API when added

```tsx
// src/pages/ServicesPage.tsx
export default function ServicesPage() {
  const {
    services, loading, error, totalCount,
    page, setPage, pageSize, setPageSize,
    query, setQuery,
    createService, updateService, deleteService,
  } = useCatalogServices();

  const handleProcessRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    if (newRow.isNew) {
      const created = await createService({ name: newRow.name, description: newRow.description, price: newRow.price });
      return { ...created, isNew: false };
    }
    const updated = await updateService(newRow.id, { name: newRow.name, description: newRow.description, price: newRow.price });
    return updated;
  };

  // render DataGrid with columns, search bar, add button
}
```

#### `ServicesDataGrid` (`src/features/catalog/components/ServicesDataGrid.tsx`)

```tsx
interface ServicesDataGridProps {
  rows: CatalogServiceResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onProcessRowUpdate: (newRow: GridRowModel, oldRow: GridRowModel) => Promise<GridRowModel>;
  onDeleteRow: (id: number) => void;
}

export function ServicesDataGrid({ ... }: ServicesDataGridProps) {
  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", flex: 1, editable: true },
    { field: "description", headerName: "Descripción", flex: 2, editable: true },
    { field: "price", headerName: "Precio", width: 150, editable: true, type: "number",
      valueFormatter: (value) => value != null ? `$${value.toFixed(2)}` : "—" },
    {
      field: "actions", headerName: "Acciones", width: 100, sortable: false,
      renderCell: (params) => (
        <IconButton onClick={() => onDeleteRow(params.row.id)} color="error" size="small">
          <DeleteIcon />
        </IconButton>
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
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={(model) => { onPageChange(model.page); onPageSizeChange(model.pageSize); }}
      pageSizeOptions={[12, 24, 48]}
      processRowUpdate={onProcessRowUpdate}
      editMode="row"
    />
  );
}
```

#### `ProductsPage` — route: `/productos`

**UI Layout:**
- Page title: **"Productos"**
- Search `TextField` with placeholder: "Buscar por nombre o descripción..."
- `Button` "Agregar producto" → adds new empty row
- `DataGrid` (MUI X) with inline editing:
  - Columns: `Nombre` (editable), `Descripción` (editable), `Cantidad` (editable, integer, default 0), `Precio unitario` (editable, numeric, default 0), `Acciones` (delete icon button)
  - Pagination: server-side, 12 rows per page
  - Same `processRowUpdate` pattern as Services

#### `ProductsDataGrid` (`src/features/catalog/components/ProductsDataGrid.tsx`)

```tsx
interface ProductsDataGridProps {
  rows: ProductResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onProcessRowUpdate: (newRow: GridRowModel, oldRow: GridRowModel) => Promise<GridRowModel>;
  onDeleteRow: (id: number) => void;
}

export function ProductsDataGrid({ ... }: ProductsDataGridProps) {
  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", flex: 1, editable: true },
    { field: "description", headerName: "Descripción", flex: 2, editable: true },
    { field: "quantity", headerName: "Cantidad", width: 120, editable: true, type: "number" },
    { field: "unitPrice", headerName: "Precio unitario", width: 150, editable: true, type: "number",
      valueFormatter: (value) => value != null ? `$${value.toFixed(2)}` : "—" },
    {
      field: "actions", headerName: "Acciones", width: 100, sortable: false,
      renderCell: (params) => (
        <IconButton onClick={() => onDeleteRow(params.row.id)} color="error" size="small">
          <DeleteIcon />
        </IconButton>
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
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={(model) => { onPageChange(model.page); onPageSizeChange(model.pageSize); }}
      pageSizeOptions={[12, 24, 48]}
      processRowUpdate={onProcessRowUpdate}
      editMode="row"
    />
  );
}
```

#### `CannedJobsPage` — route: `/trabajos-enlatados`

**UI Layout:**
- Page title: **"Trabajos enlatados"**
- Search `TextField` with placeholder: "Buscar por título o descripción..."
- `Button` "Agregar trabajo enlatado" → opens `CannedJobFormDialog`
- `DataGrid`:
  - Columns: `Título`, `Descripción`, `Acciones` (edit + delete icon buttons)
  - Pagination: server-side, 12 rows per page
  - **Not inline-editable** (canned jobs have nested children, so a dialog form is used instead)

#### `CannedJobsDataGrid` (`src/features/catalog/components/CannedJobsDataGrid.tsx`)

```tsx
interface CannedJobsDataGridProps {
  rows: CannedJobResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEditRow: (id: number) => void;
  onDeleteRow: (id: number) => void;
}

export function CannedJobsDataGrid({ ... }: CannedJobsDataGridProps) {
  const columns: GridColDef[] = [
    { field: "title", headerName: "Título", flex: 1 },
    { field: "description", headerName: "Descripción", flex: 2 },
    {
      field: "actions", headerName: "Acciones", width: 120, sortable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => onEditRow(params.row.id)} size="small"><EditIcon /></IconButton>
          <IconButton onClick={() => onDeleteRow(params.row.id)} color="error" size="small"><DeleteIcon /></IconButton>
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
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={(model) => { onPageChange(model.page); onPageSizeChange(model.pageSize); }}
      pageSizeOptions={[12, 24, 48]}
    />
  );
}
```

#### `CannedJobFormDialog` (`src/features/catalog/components/CannedJobFormDialog.tsx`)

A MUI `Dialog` used for both creating and editing canned jobs.

**Props:**

```tsx
interface CannedJobFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CannedJobRequest) => Promise<void>;
  initialData?: CannedJobDetailResponse | null; // null = create mode
}
```

**Dialog content:**
- `TextField` for **Título** (required)
- `TextField` for **Descripción** (multiline, optional)
- **Servicios** section:
  - `Typography` heading: "Servicios"
  - List of service rows, each with: `TextField` (Nombre del servicio), `TextField` (Precio, type=number)
  - `Button` "Agregar servicio" → appends a new empty service row
  - Each row has a delete `IconButton`
- **Productos** section:
  - `Typography` heading: "Productos"
  - List of product rows, each with: `TextField` (Nombre del producto), `TextField` (Cantidad, type=number), `TextField` (Precio unitario, type=number)
  - `Button` "Agregar producto" → appends a new empty product row
  - Each row has a delete `IconButton`
- **Dialog actions:**
  - `Button` "Cancelar" → closes dialog
  - `Button` "Guardar" → validates and calls `onSave`

---

### 5.6 Routes

Add to `src/routes/`:

```tsx
{ path: "/servicios", element: <ServicesPage /> }
{ path: "/productos", element: <ProductsPage /> }
{ path: "/trabajos-enlatados", element: <CannedJobsPage /> }
```

Use `React.lazy` for page-level components:

```tsx
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const CannedJobsPage = lazy(() => import("@/pages/CannedJobsPage"));
```

---

## 6. Business Rules

1. **Name/Title required**: `services.name`, `products.name`, and `canned_jobs.title` are mandatory. Validated both on DTOs and DB (NOT NULL).
2. **Price optional for catalog items**: `services.price` and `products.unit_price` are nullable in the catalog — they serve as suggested defaults. When used in an estimate/invoice, price is required.
3. **Quantity defaults to 0**: `products.quantity` defaults to 0 if not provided.
4. **Canned job snapshot behavior**: `canned_job_services` and `canned_job_products` store `service_name`/`product_name` as plain strings (not FK references). This means:
   - Canned jobs capture a **snapshot** of the service/product name and price at creation time.
   - If the catalog service/product is later renamed or re-priced, existing canned jobs are unaffected.
   - This same snapshot pattern is used when canned jobs are applied to estimates/invoices.
5. **Canned job children — replace on update**: When updating a canned job, the entire list of services and products is replaced (clear + re-add). No partial updates on child entities.
6. **Delete cascade**: Deleting a canned job cascades to its `canned_job_services` and `canned_job_products` (DB-level `ON DELETE CASCADE` + JPA `orphanRemoval = true`).
7. **No duplicate name validation**: Services and products can have duplicate names (different workshops may have similar services at different prices).
8. **Pagination**: All list endpoints are server-side paginated with a default page size of 12.
9. **Search**: Case-insensitive search on `name`/`title` and `description` fields using `ILIKE` (via Spring Data `ContainingIgnoreCase`).

---

## 7. Testing

### 7.1 Backend — Unit Tests

#### Service layer tests (JUnit 5 + Mockito)

For each service (`CatalogServiceServiceImpl`, `ProductServiceImpl`, `CannedJobServiceImpl`):

| Test class | Test methods |
|---|---|
| `CatalogServiceServiceImplTest` | `search_withQuery_returnsFilteredPage()`, `search_withBlankQuery_returnsAll()`, `getById_existingId_returnsResponse()`, `getById_nonExistingId_throwsResourceNotFoundException()`, `create_validRequest_returnsResponse()`, `update_existingId_returnsUpdatedResponse()`, `update_nonExistingId_throwsResourceNotFoundException()`, `delete_existingId_deletesSuccessfully()`, `delete_nonExistingId_throwsResourceNotFoundException()` |
| `ProductServiceImplTest` | Same pattern as above |
| `CannedJobServiceImplTest` | Same pattern as above + `create_withServicesAndProducts_savesChildren()`, `update_replacesChildren()` |

#### Controller layer tests (MockMvc + `@WebMvcTest`)

| Test class | Test methods |
|---|---|
| `CatalogServiceControllerTest` | `search_returns200()`, `getById_returns200()`, `create_validRequest_returns201()`, `create_invalidRequest_returns400()`, `update_returns200()`, `delete_returns200()` |
| `ProductControllerTest` | Same pattern |
| `CannedJobControllerTest` | Same pattern |

#### Mapper tests

| Test class | Test methods |
|---|---|
| `CatalogServiceMapperTest` | `toResponse_mapsAllFields()`, `toEntity_mapsAllFields()`, `updateEntity_updatesAllFields()` |
| `ProductMapperTest` | Same pattern |
| `CannedJobMapperTest` | `toResponse_mapsAllFields()`, `toDetailResponse_mapsWithChildren()`, `toEntity_ignoresChildCollections()` |

### 7.2 Frontend — Unit Tests (Vitest + React Testing Library)

| Test file | What it covers |
|---|---|
| `ServicesDataGrid.test.tsx` | Renders columns correctly, shows loading state, calls `onDeleteRow`, calls `onProcessRowUpdate` |
| `ProductsDataGrid.test.tsx` | Same pattern |
| `CannedJobsDataGrid.test.tsx` | Renders columns, calls `onEditRow`, calls `onDeleteRow` |
| `CannedJobFormDialog.test.tsx` | Opens in create mode (empty fields), opens in edit mode (pre-filled), adds/removes service rows, adds/removes product rows, validates required fields, calls `onSave` with correct data |
| `useCatalogServices.test.ts` | Fetches data on mount, handles search query changes, create/update/delete trigger refetch |
| `useProducts.test.ts` | Same pattern |
| `useCannedJobs.test.ts` | Same pattern |
