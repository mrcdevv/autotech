# 06 — Órdenes de Trabajo (Core Shell)

## 1. Overview

This spec implements the **core shell** of the Repair Orders module — the central entity of the Autotech system. Repair orders track a vehicle's lifecycle through the workshop from intake to delivery. The UI presents a **Kanban board** for the list view, a **tabbed detail view**, and a **creation form**.

> **Scope**: This spec covers ONLY the core shell. The detail view has 5 tabs, but only the **"Información General"** tab is fully functional here. The other 4 tabs (**Inspecciones**, **Presupuesto**, **Trabajos**, **Factura**) render as placeholder tabs displaying "Próximamente" and will be filled in by specs `07-inspecciones.md`, `08-presupuesto.md`, `09-trabajos.md`, and `10-factura.md` respectively.

**Dependencies**: Clients (spec 02), Vehicles (spec 03), Employees (spec 01), Appointments (spec 05), Tags (configuration).

---

## 2. Git

| Item | Value |
|------|-------|
| Branch | `feature/ordenes-trabajo` |
| Base | `main` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add RepairOrder entity and RepairOrderStatus enum`
- `feat: add RepairOrderRepository with search and filter queries`
- `feat: add repair order DTOs and MapStruct mapper`
- `feat: add RepairOrderService with CRUD, status transitions, and search`
- `feat: add RepairOrderController REST endpoints`
- `feat: add repair order types and API layer`
- `feat: add RepairOrdersPage with KanbanBoard`
- `feat: add RepairOrderDetailPage with tabs and GeneralInfoTab`
- `feat: add CreateRepairOrderPage with cascading client-vehicle form`
- `test: add unit tests for RepairOrderService`

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. **No new migration needed.**

### 3.1 `repair_orders`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `BIGSERIAL` | PK |
| `title` | `VARCHAR(255)` | nullable |
| `client_id` | `BIGINT` | NOT NULL, FK → `clients(id)` |
| `vehicle_id` | `BIGINT` | NOT NULL, FK → `vehicles(id)` |
| `appointment_id` | `BIGINT` | FK → `appointments(id)`, nullable |
| `reason` | `TEXT` | nullable |
| `client_source` | `VARCHAR(100)` | nullable |
| `status` | `VARCHAR(50)` | NOT NULL, DEFAULT `'INGRESO_VEHICULO'`, CHECK (7 values) |
| `mechanic_notes` | `TEXT` | nullable |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

**Indexes**: `idx_repair_orders_client_id`, `idx_repair_orders_vehicle_id`, `idx_repair_orders_status`.

**Status CHECK values**: `INGRESO_VEHICULO`, `ESPERANDO_APROBACION_PRESUPUESTO`, `ESPERANDO_REPUESTOS`, `REPARACION`, `PRUEBAS`, `LISTO_PARA_ENTREGAR`, `ENTREGADO`.

### 3.2 `repair_order_employees` (join table)

| Column | Type | Constraints |
|--------|------|-------------|
| `repair_order_id` | `BIGINT` | FK → `repair_orders(id)` ON DELETE CASCADE, PK |
| `employee_id` | `BIGINT` | FK → `employees(id)` ON DELETE CASCADE, PK |

### 3.3 `repair_order_tags` (join table)

| Column | Type | Constraints |
|--------|------|-------------|
| `repair_order_id` | `BIGINT` | FK → `repair_orders(id)` ON DELETE CASCADE, PK |
| `tag_id` | `BIGINT` | FK → `tags(id)` ON DELETE CASCADE, PK |

---

## 4. Backend

Package: `com.autotech.repairorder`

### 4.1 Package Structure

```
com.autotech.repairorder/
├── controller/
│   └── RepairOrderController.java
├── service/
│   ├── RepairOrderService.java              (interface)
│   └── RepairOrderServiceImpl.java          (implementation)
├── repository/
│   └── RepairOrderRepository.java
├── model/
│   ├── RepairOrder.java                     (entity)
│   └── RepairOrderStatus.java              (enum)
└── dto/
    ├── RepairOrderRequest.java              (record — create/update)
    ├── RepairOrderResponse.java             (record — list/kanban cards)
    ├── RepairOrderDetailResponse.java       (record — detail view)
    ├── StatusUpdateRequest.java             (record — status change)
    ├── TitleUpdateRequest.java              (record — title edit)
    └── RepairOrderMapper.java               (MapStruct interface)
```

---

### 4.2 Enum — `RepairOrderStatus`

```java
package com.autotech.repairorder.model;

public enum RepairOrderStatus {
    INGRESO_VEHICULO,
    ESPERANDO_APROBACION_PRESUPUESTO,
    ESPERANDO_REPUESTOS,
    REPARACION,
    PRUEBAS,
    LISTO_PARA_ENTREGAR,
    ENTREGADO
}
```

---

### 4.3 Entity — `RepairOrder`

Location: `com.autotech.repairorder.model.RepairOrder`

```java
@Entity
@Table(name = "repair_orders")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RepairOrder extends BaseEntity {

    @Column(name = "title", length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "client_source", length = 100)
    private String clientSource;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RepairOrderStatus status = RepairOrderStatus.INGRESO_VEHICULO;

    @Column(name = "mechanic_notes", columnDefinition = "TEXT")
    private String mechanicNotes;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "repair_order_employees",
        joinColumns = @JoinColumn(name = "repair_order_id"),
        inverseJoinColumns = @JoinColumn(name = "employee_id")
    )
    @Builder.Default
    private Set<Employee> employees = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "repair_order_tags",
        joinColumns = @JoinColumn(name = "repair_order_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RepairOrder other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

> **Note**: `Client`, `Vehicle`, `Appointment` are existing entities from their respective packages. `Employee` is from `com.autotech.employee.model`. `Tag` is from `com.autotech.tag.model` (or `com.autotech.common.model.Tag`).

---

### 4.4 Repository — `RepairOrderRepository`

Location: `com.autotech.repairorder.repository.RepairOrderRepository`

```java
@Repository
public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {

    @EntityGraph(attributePaths = {"client", "vehicle", "vehicle.brand", "employees", "tags"})
    List<RepairOrder> findByStatusIn(List<RepairOrderStatus> statuses);

    @EntityGraph(attributePaths = {"client", "vehicle", "vehicle.brand", "employees", "tags"})
    List<RepairOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"client", "vehicle", "vehicle.brand", "employees", "tags", "appointment"})
    Optional<RepairOrder> findWithDetailsById(Long id);

    List<RepairOrder> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    boolean existsByVehicleIdAndStatusNot(Long vehicleId, RepairOrderStatus status);

    @Query("""
        SELECT DISTINCT ro FROM RepairOrder ro
        LEFT JOIN ro.client c
        LEFT JOIN ro.vehicle v
        LEFT JOIN v.brand b
        LEFT JOIN ro.employees e
        LEFT JOIN ro.tags t
        WHERE LOWER(ro.title) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(v.plate) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(b.name) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(v.model) LIKE LOWER(CONCAT('%', :query, '%'))
    """)
    List<RepairOrder> search(@Param("query") String query);

    @Query("""
        SELECT DISTINCT ro FROM RepairOrder ro
        JOIN ro.employees e
        WHERE e.id = :employeeId
    """)
    List<RepairOrder> findByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("""
        SELECT DISTINCT ro FROM RepairOrder ro
        JOIN ro.tags t
        WHERE t.id = :tagId
    """)
    List<RepairOrder> findByTagId(@Param("tagId") Long tagId);
}
```

---

### 4.5 DTOs

Location: `com.autotech.repairorder.dto`

#### `RepairOrderRequest` (create/update)

```java
public record RepairOrderRequest(

    @NotNull(message = "El cliente es obligatorio")
    Long clientId,

    @NotNull(message = "El vehículo es obligatorio")
    Long vehicleId,

    Long appointmentId,

    @Size(max = 5000, message = "El motivo no puede superar los 5000 caracteres")
    String reason,

    @Size(max = 100, message = "El origen del cliente no puede superar los 100 caracteres")
    String clientSource,

    List<Long> employeeIds,

    List<Long> tagIds
) {}
```

> **Note**: `title` is NOT included in the request — it is auto-generated by the service at creation time (see Business Rules §6). `status` defaults to `INGRESO_VEHICULO` and is managed via a separate endpoint.

#### `RepairOrderResponse` (used for Kanban cards and list views)

```java
public record RepairOrderResponse(
    Long id,
    String title,
    RepairOrderStatus status,
    Long clientId,
    String clientFirstName,
    String clientLastName,
    String clientPhone,
    Long vehicleId,
    String vehiclePlate,
    String vehicleBrandName,
    String vehicleModel,
    Integer vehicleYear,
    List<EmployeeSummary> employees,
    List<TagResponse> tags,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {

    public record EmployeeSummary(
        Long id,
        String firstName,
        String lastName
    ) {}

    public record TagResponse(
        Long id,
        String name,
        String color
    ) {}
}
```

#### `RepairOrderDetailResponse` (used for the detail view)

```java
public record RepairOrderDetailResponse(
    Long id,
    String title,
    RepairOrderStatus status,
    String reason,
    String clientSource,
    String mechanicNotes,
    Long appointmentId,

    // Client data (readonly in UI)
    Long clientId,
    String clientFirstName,
    String clientLastName,
    String clientDni,
    String clientPhone,
    String clientEmail,

    // Vehicle data (readonly in UI)
    Long vehicleId,
    String vehiclePlate,
    String vehicleBrandName,
    String vehicleModel,
    Integer vehicleYear,
    String vehicleChassisNumber,

    // Assigned employees
    List<RepairOrderResponse.EmployeeSummary> employees,

    // Assigned tags
    List<RepairOrderResponse.TagResponse> tags,

    // Work history for the vehicle (all repair orders for this vehicle)
    List<WorkHistoryEntry> workHistory,

    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {

    public record WorkHistoryEntry(
        Long repairOrderId,
        String repairOrderTitle,
        String reason,
        LocalDateTime createdAt
    ) {}
}
```

#### `StatusUpdateRequest`

```java
public record StatusUpdateRequest(

    @NotNull(message = "El nuevo estado es obligatorio")
    RepairOrderStatus newStatus
) {}
```

#### `TitleUpdateRequest`

```java
public record TitleUpdateRequest(

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 255, message = "El título no puede superar los 255 caracteres")
    String title
) {}
```

---

### 4.6 Mapper — `RepairOrderMapper`

Location: `com.autotech.repairorder.dto.RepairOrderMapper`

```java
@Mapper(componentModel = "spring")
public interface RepairOrderMapper {

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFirstName", source = "client.firstName")
    @Mapping(target = "clientLastName", source = "client.lastName")
    @Mapping(target = "clientPhone", source = "client.phone")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehiclePlate", source = "vehicle.plate")
    @Mapping(target = "vehicleBrandName", source = "vehicle.brand.name")
    @Mapping(target = "vehicleModel", source = "vehicle.model")
    @Mapping(target = "vehicleYear", source = "vehicle.year")
    @Mapping(target = "employees", source = "employees")
    @Mapping(target = "tags", source = "tags")
    RepairOrderResponse toResponse(RepairOrder entity);

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFirstName", source = "client.firstName")
    @Mapping(target = "clientLastName", source = "client.lastName")
    @Mapping(target = "clientDni", source = "client.dni")
    @Mapping(target = "clientPhone", source = "client.phone")
    @Mapping(target = "clientEmail", source = "client.email")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehiclePlate", source = "vehicle.plate")
    @Mapping(target = "vehicleBrandName", source = "vehicle.brand.name")
    @Mapping(target = "vehicleModel", source = "vehicle.model")
    @Mapping(target = "vehicleYear", source = "vehicle.year")
    @Mapping(target = "vehicleChassisNumber", source = "vehicle.chassisNumber")
    @Mapping(target = "appointmentId", source = "appointment.id")
    @Mapping(target = "employees", source = "employees")
    @Mapping(target = "tags", source = "tags")
    @Mapping(target = "workHistory", ignore = true)  // populated by service
    RepairOrderDetailResponse toDetailResponse(RepairOrder entity);

    RepairOrderResponse.EmployeeSummary toEmployeeSummary(Employee employee);

    RepairOrderResponse.TagResponse toTagResponse(Tag tag);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "title", ignore = true)       // auto-generated by service
    @Mapping(target = "status", ignore = true)       // defaults to INGRESO_VEHICULO
    @Mapping(target = "mechanicNotes", ignore = true)
    @Mapping(target = "client", ignore = true)       // resolved by service
    @Mapping(target = "vehicle", ignore = true)      // resolved by service
    @Mapping(target = "appointment", ignore = true)  // resolved by service
    @Mapping(target = "employees", ignore = true)    // resolved by service
    @Mapping(target = "tags", ignore = true)         // resolved by service
    RepairOrder toEntity(RepairOrderRequest request);
}
```

---

### 4.7 Service — `RepairOrderService`

Location: `com.autotech.repairorder.service.RepairOrderService`

#### Interface

```java
public interface RepairOrderService {

    List<RepairOrderResponse> getAll();

    RepairOrderDetailResponse getById(Long id);

    RepairOrderResponse create(RepairOrderRequest request);

    RepairOrderResponse update(Long id, RepairOrderRequest request);

    void delete(Long id);

    RepairOrderResponse updateStatus(Long id, StatusUpdateRequest request);

    RepairOrderResponse updateTitle(Long id, TitleUpdateRequest request);

    List<RepairOrderResponse> getByStatus(List<RepairOrderStatus> statuses);

    RepairOrderResponse assignEmployees(Long id, List<Long> employeeIds);

    RepairOrderResponse assignTags(Long id, List<Long> tagIds);

    List<RepairOrderResponse> search(String query);

    List<RepairOrderResponse> filterByEmployee(Long employeeId);

    List<RepairOrderResponse> filterByTag(Long tagId);
}
```

#### Implementation — `RepairOrderServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class RepairOrderServiceImpl implements RepairOrderService {

    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderMapper repairOrderMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final AppointmentRepository appointmentRepository;  // nullable dependency
    private final EmployeeRepository employeeRepository;
    private final TagRepository tagRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getAll() {
        return repairOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RepairOrderDetailResponse getById(Long id) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        RepairOrderDetailResponse response = repairOrderMapper.toDetailResponse(order);

        // Build work history: all repair orders for this vehicle
        List<RepairOrder> vehicleOrders = repairOrderRepository
                .findByVehicleIdOrderByCreatedAtDesc(order.getVehicle().getId());
        List<RepairOrderDetailResponse.WorkHistoryEntry> workHistory = vehicleOrders.stream()
                .map(ro -> new RepairOrderDetailResponse.WorkHistoryEntry(
                        ro.getId(),
                        ro.getTitle(),
                        ro.getReason(),
                        ro.getCreatedAt()
                ))
                .toList();

        // Return new response with workHistory populated
        return new RepairOrderDetailResponse(
                response.id(), response.title(), response.status(),
                response.reason(), response.clientSource(), response.mechanicNotes(),
                response.appointmentId(),
                response.clientId(), response.clientFirstName(), response.clientLastName(),
                response.clientDni(), response.clientPhone(), response.clientEmail(),
                response.vehicleId(), response.vehiclePlate(), response.vehicleBrandName(),
                response.vehicleModel(), response.vehicleYear(), response.vehicleChassisNumber(),
                response.employees(), response.tags(),
                workHistory,
                response.createdAt(), response.updatedAt()
        );
    }

    @Override
    @Transactional
    public RepairOrderResponse create(RepairOrderRequest request) {
        // 1. Resolve client
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));

        // 2. Resolve vehicle (must belong to the given client)
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
        if (!vehicle.getClient().getId().equals(client.getId())) {
            throw new IllegalArgumentException("El vehículo no pertenece al cliente seleccionado");
        }

        // 3. Resolve appointment (optional)
        Appointment appointment = null;
        if (request.appointmentId() != null) {
            appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", request.appointmentId()));
        }

        // 4. Build entity
        RepairOrder order = repairOrderMapper.toEntity(request);
        order.setClient(client);
        order.setVehicle(vehicle);
        order.setAppointment(appointment);
        order.setReason(request.reason());
        order.setStatus(RepairOrderStatus.INGRESO_VEHICULO);

        // 5. Auto-generate title: "OT-{id} {clientLastName} - {plate}"
        //    Since ID is not yet available, save first then update title
        RepairOrder saved = repairOrderRepository.save(order);
        String autoTitle = String.format("OT-%d %s - %s",
                saved.getId(), client.getLastName(), vehicle.getPlate());
        saved.setTitle(autoTitle);

        // 6. Assign employees (optional)
        if (request.employeeIds() != null && !request.employeeIds().isEmpty()) {
            Set<Employee> employees = resolveEmployees(request.employeeIds());
            saved.setEmployees(employees);
        }

        // 7. Assign tags (optional)
        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            Set<Tag> tags = resolveTags(request.tagIds());
            saved.setTags(tags);
        }

        RepairOrder result = repairOrderRepository.save(saved);
        log.info("Created repair order with id {} and title '{}'", result.getId(), result.getTitle());
        return repairOrderMapper.toResponse(result);
    }

    @Override
    @Transactional
    public RepairOrderResponse update(Long id, RepairOrderRequest request) {
        RepairOrder existing = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        // Resolve client
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));

        // Resolve vehicle (must belong to client)
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
        if (!vehicle.getClient().getId().equals(client.getId())) {
            throw new IllegalArgumentException("El vehículo no pertenece al cliente seleccionado");
        }

        // Resolve appointment (optional)
        Appointment appointment = null;
        if (request.appointmentId() != null) {
            appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", request.appointmentId()));
        }

        // Update fields
        existing.setClient(client);
        existing.setVehicle(vehicle);
        existing.setAppointment(appointment);
        existing.setReason(request.reason());
        existing.setClientSource(request.clientSource());

        // Update employees
        if (request.employeeIds() != null) {
            existing.getEmployees().clear();
            if (!request.employeeIds().isEmpty()) {
                existing.setEmployees(resolveEmployees(request.employeeIds()));
            }
        }

        // Update tags
        if (request.tagIds() != null) {
            existing.getTags().clear();
            if (!request.tagIds().isEmpty()) {
                existing.setTags(resolveTags(request.tagIds()));
            }
        }

        RepairOrder saved = repairOrderRepository.save(existing);
        log.info("Updated repair order with id {}", saved.getId());
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        RepairOrder order = repairOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));
        repairOrderRepository.delete(order);
        log.info("Deleted repair order with id {}", id);
    }

    @Override
    @Transactional
    public RepairOrderResponse updateStatus(Long id, StatusUpdateRequest request) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        RepairOrderStatus newStatus = request.newStatus();

        // Validate: cannot transition back to initial states
        if (newStatus == RepairOrderStatus.INGRESO_VEHICULO
                || newStatus == RepairOrderStatus.ESPERANDO_APROBACION_PRESUPUESTO) {
            throw new IllegalArgumentException(
                    "No se puede cambiar al estado '" + newStatus + "'. "
                    + "Los estados 'Ingresó vehículo' y 'Esperando aprobación presupuesto' son estados iniciales.");
        }

        log.info("Updating repair order {} status from {} to {}", id, order.getStatus(), newStatus);
        order.setStatus(newStatus);
        RepairOrder saved = repairOrderRepository.save(order);
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RepairOrderResponse updateTitle(Long id, TitleUpdateRequest request) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        order.setTitle(request.title());
        RepairOrder saved = repairOrderRepository.save(order);
        log.info("Updated title for repair order {} to '{}'", id, request.title());
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getByStatus(List<RepairOrderStatus> statuses) {
        return repairOrderRepository.findByStatusIn(statuses).stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RepairOrderResponse assignEmployees(Long id, List<Long> employeeIds) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        order.getEmployees().clear();
        if (employeeIds != null && !employeeIds.isEmpty()) {
            order.setEmployees(resolveEmployees(employeeIds));
        }

        RepairOrder saved = repairOrderRepository.save(order);
        log.info("Assigned {} employees to repair order {}", employeeIds != null ? employeeIds.size() : 0, id);
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RepairOrderResponse assignTags(Long id, List<Long> tagIds) {
        RepairOrder order = repairOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RepairOrder", id));

        order.getTags().clear();
        if (tagIds != null && !tagIds.isEmpty()) {
            order.setTags(resolveTags(tagIds));
        }

        RepairOrder saved = repairOrderRepository.save(order);
        log.info("Assigned {} tags to repair order {}", tagIds != null ? tagIds.size() : 0, id);
        return repairOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return getAll();
        }
        return repairOrderRepository.search(query).stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> filterByEmployee(Long employeeId) {
        return repairOrderRepository.findByEmployeeId(employeeId).stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepairOrderResponse> filterByTag(Long tagId) {
        return repairOrderRepository.findByTagId(tagId).stream()
                .map(repairOrderMapper::toResponse)
                .toList();
    }

    // --- Private helpers ---

    private Set<Employee> resolveEmployees(List<Long> employeeIds) {
        Set<Employee> employees = new HashSet<>();
        for (Long empId : employeeIds) {
            Employee emp = employeeRepository.findById(empId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", empId));
            employees.add(emp);
        }
        return employees;
    }

    private Set<Tag> resolveTags(List<Long> tagIds) {
        Set<Tag> tags = new HashSet<>();
        for (Long tagId : tagIds) {
            Tag tag = tagRepository.findById(tagId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));
            tags.add(tag);
        }
        return tags;
    }
}
```

---

### 4.8 Controller — `RepairOrderController`

Location: `com.autotech.repairorder.controller.RepairOrderController`

Base path: `/api/repair-orders`

```java
@RestController
@RequestMapping("/api/repair-orders")
@RequiredArgsConstructor
public class RepairOrderController {

    private final RepairOrderService repairOrderService;

    // GET /api/repair-orders
    @GetMapping
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.getAll()));
    }

    // GET /api/repair-orders/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RepairOrderDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.getById(id)));
    }

    // POST /api/repair-orders
    @PostMapping
    public ResponseEntity<ApiResponse<RepairOrderResponse>> create(
            @Valid @RequestBody RepairOrderRequest request) {
        RepairOrderResponse created = repairOrderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Orden de trabajo creada", created));
    }

    // PUT /api/repair-orders/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody RepairOrderRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Orden de trabajo actualizada", repairOrderService.update(id, request)));
    }

    // DELETE /api/repair-orders/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        repairOrderService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Orden de trabajo eliminada", null));
    }

    // PATCH /api/repair-orders/{id}/status
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Estado actualizado", repairOrderService.updateStatus(id, request)));
    }

    // PATCH /api/repair-orders/{id}/title
    @PatchMapping("/{id}/title")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> updateTitle(
            @PathVariable Long id,
            @Valid @RequestBody TitleUpdateRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Título actualizado", repairOrderService.updateTitle(id, request)));
    }

    // GET /api/repair-orders/by-status?statuses=INGRESO_VEHICULO,ESPERANDO_APROBACION_PRESUPUESTO
    @GetMapping("/by-status")
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> getByStatus(
            @RequestParam List<RepairOrderStatus> statuses) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.getByStatus(statuses)));
    }

    // PUT /api/repair-orders/{id}/employees
    @PutMapping("/{id}/employees")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> assignEmployees(
            @PathVariable Long id,
            @RequestBody List<Long> employeeIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Empleados asignados", repairOrderService.assignEmployees(id, employeeIds)));
    }

    // PUT /api/repair-orders/{id}/tags
    @PutMapping("/{id}/tags")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> assignTags(
            @PathVariable Long id,
            @RequestBody List<Long> tagIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Etiquetas asignadas", repairOrderService.assignTags(id, tagIds)));
    }

    // GET /api/repair-orders/search?query=...
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> search(
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.search(query)));
    }

    // GET /api/repair-orders/filter/by-employee?employeeId=1
    @GetMapping("/filter/by-employee")
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> filterByEmployee(
            @RequestParam Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.filterByEmployee(employeeId)));
    }

    // GET /api/repair-orders/filter/by-tag?tagId=1
    @GetMapping("/filter/by-tag")
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> filterByTag(
            @RequestParam Long tagId) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.filterByTag(tagId)));
    }
}
```

#### Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/repair-orders` | List all repair orders (for Kanban) |
| `GET` | `/api/repair-orders/{id}` | Get repair order detail (with work history) |
| `POST` | `/api/repair-orders` | Create a new repair order |
| `PUT` | `/api/repair-orders/{id}` | Update a repair order |
| `DELETE` | `/api/repair-orders/{id}` | Delete a repair order |
| `PATCH` | `/api/repair-orders/{id}/status` | Update status |
| `PATCH` | `/api/repair-orders/{id}/title` | Update title |
| `GET` | `/api/repair-orders/by-status?statuses=...` | Get by status(es) |
| `PUT` | `/api/repair-orders/{id}/employees` | Assign employees |
| `PUT` | `/api/repair-orders/{id}/tags` | Assign tags |
| `GET` | `/api/repair-orders/search?query=...` | Search (title, name, plate, brand, model) |
| `GET` | `/api/repair-orders/filter/by-employee?employeeId=...` | Filter by assigned employee |
| `GET` | `/api/repair-orders/filter/by-tag?tagId=...` | Filter by tag |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   └── repairOrders.ts
├── features/
│   └── repair-orders/
│       ├── components/
│       │   ├── KanbanBoard.tsx
│       │   ├── KanbanColumn.tsx
│       │   ├── RepairOrderCard.tsx
│       │   ├── StatusUpdateDialog.tsx
│       │   ├── RepairOrderDetailTabs.tsx
│       │   ├── GeneralInfoTab.tsx
│       │   ├── PlaceholderTab.tsx
│       │   └── CreateRepairOrderForm.tsx
│       ├── hooks/
│       │   ├── useRepairOrders.ts
│       │   └── useRepairOrder.ts
│       └── types.ts
├── pages/
│   ├── RepairOrdersPage.tsx
│   ├── RepairOrderDetailPage.tsx
│   └── CreateRepairOrderPage.tsx
└── routes/
    └── (add routes to existing router config)
```

---

### 5.2 Types

Location: `src/features/repair-orders/types.ts`

```typescript
// ---- Status enum ----

export type RepairOrderStatus =
  | "INGRESO_VEHICULO"
  | "ESPERANDO_APROBACION_PRESUPUESTO"
  | "ESPERANDO_REPUESTOS"
  | "REPARACION"
  | "PRUEBAS"
  | "LISTO_PARA_ENTREGAR"
  | "ENTREGADO";

// ---- Human-readable status labels (Spanish) ----

export const STATUS_LABELS: Record<RepairOrderStatus, string> = {
  INGRESO_VEHICULO: "Ingresó vehículo",
  ESPERANDO_APROBACION_PRESUPUESTO: "Esperando aprobación presupuesto",
  ESPERANDO_REPUESTOS: "Esperando repuestos",
  REPARACION: "Reparación",
  PRUEBAS: "Pruebas",
  LISTO_PARA_ENTREGAR: "Listo para entregar",
  ENTREGADO: "Entregado",
};

// ---- Kanban column mapping ----

export const KANBAN_COLUMNS = [
  {
    title: "Presupuesto",
    statuses: ["INGRESO_VEHICULO", "ESPERANDO_APROBACION_PRESUPUESTO"] as RepairOrderStatus[],
  },
  {
    title: "Trabajo en proceso",
    statuses: ["ESPERANDO_REPUESTOS", "REPARACION", "PRUEBAS"] as RepairOrderStatus[],
  },
  {
    title: "Completada",
    statuses: ["LISTO_PARA_ENTREGAR", "ENTREGADO"] as RepairOrderStatus[],
  },
];

// ---- Statuses available for manual update ----
// (excludes INGRESO_VEHICULO and ESPERANDO_APROBACION_PRESUPUESTO which are initial-only)

export const UPDATABLE_STATUSES: RepairOrderStatus[] = [
  "ESPERANDO_REPUESTOS",
  "REPARACION",
  "PRUEBAS",
  "LISTO_PARA_ENTREGAR",
  "ENTREGADO",
];

// ---- Nested types ----

export interface EmployeeSummary {
  id: number;
  firstName: string;
  lastName: string;
}

export interface TagResponse {
  id: number;
  name: string;
  color: string | null;
}

// ---- Response for Kanban cards ----

export interface RepairOrderResponse {
  id: number;
  title: string | null;
  status: RepairOrderStatus;
  clientId: number;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrandName: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  employees: EmployeeSummary[];
  tags: TagResponse[];
  createdAt: string;   // ISO datetime
  updatedAt: string;   // ISO datetime
}

// ---- Work history entry ----

export interface WorkHistoryEntry {
  repairOrderId: number;
  repairOrderTitle: string | null;
  reason: string | null;
  createdAt: string;   // ISO datetime
}

// ---- Detail response ----

export interface RepairOrderDetailResponse {
  id: number;
  title: string | null;
  status: RepairOrderStatus;
  reason: string | null;
  clientSource: string | null;
  mechanicNotes: string | null;
  appointmentId: number | null;

  // Client data
  clientId: number;
  clientFirstName: string;
  clientLastName: string;
  clientDni: string | null;
  clientPhone: string;
  clientEmail: string | null;

  // Vehicle data
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrandName: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleChassisNumber: string | null;

  // Relationships
  employees: EmployeeSummary[];
  tags: TagResponse[];
  workHistory: WorkHistoryEntry[];

  createdAt: string;
  updatedAt: string;
}

// ---- Request payloads ----

export interface RepairOrderRequest {
  clientId: number;
  vehicleId: number;
  appointmentId?: number | null;
  reason?: string | null;
  clientSource?: string | null;
  employeeIds?: number[];
  tagIds?: number[];
}

export interface StatusUpdateRequest {
  newStatus: RepairOrderStatus;
}

export interface TitleUpdateRequest {
  title: string;
}
```

---

### 5.3 API Layer

Location: `src/api/repairOrders.ts`

```typescript
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  RepairOrderResponse,
  RepairOrderDetailResponse,
  RepairOrderRequest,
  StatusUpdateRequest,
  TitleUpdateRequest,
  RepairOrderStatus,
} from "@/features/repair-orders/types";

export const repairOrdersApi = {
  getAll: () =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<RepairOrderDetailResponse>>(`/repair-orders/${id}`),

  create: (data: RepairOrderRequest) =>
    apiClient.post<ApiResponse<RepairOrderResponse>>("/repair-orders", data),

  update: (id: number, data: RepairOrderRequest) =>
    apiClient.put<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/repair-orders/${id}`),

  updateStatus: (id: number, data: StatusUpdateRequest) =>
    apiClient.patch<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/status`, data),

  updateTitle: (id: number, data: TitleUpdateRequest) =>
    apiClient.patch<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/title`, data),

  getByStatus: (statuses: RepairOrderStatus[]) =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders/by-status", {
      params: { statuses: statuses.join(",") },
    }),

  assignEmployees: (id: number, employeeIds: number[]) =>
    apiClient.put<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/employees`, employeeIds),

  assignTags: (id: number, tagIds: number[]) =>
    apiClient.put<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/tags`, tagIds),

  search: (query: string) =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders/search", {
      params: { query },
    }),

  filterByEmployee: (employeeId: number) =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders/filter/by-employee", {
      params: { employeeId },
    }),

  filterByTag: (tagId: number) =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders/filter/by-tag", {
      params: { tagId },
    }),
};
```

---

### 5.4 Hooks

Location: `src/features/repair-orders/hooks/`

#### `useRepairOrders.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { repairOrdersApi } from "@/api/repairOrders";
import type { RepairOrderResponse, RepairOrderStatus, StatusUpdateRequest } from "../types";

export function useRepairOrders() {
  const [orders, setOrders] = useState<RepairOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repairOrdersApi.getAll();
      setOrders(res.data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar las órdenes de trabajo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const searchOrders = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await repairOrdersApi.search(query);
      setOrders(res.data.data);
    } catch (err: unknown) {
      setError("Error al buscar órdenes");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterByEmployee = useCallback(async (employeeId: number) => {
    setLoading(true);
    try {
      const res = await repairOrdersApi.filterByEmployee(employeeId);
      setOrders(res.data.data);
    } catch { setError("Error al filtrar por empleado"); }
    finally { setLoading(false); }
  }, []);

  const filterByTag = useCallback(async (tagId: number) => {
    setLoading(true);
    try {
      const res = await repairOrdersApi.filterByTag(tagId);
      setOrders(res.data.data);
    } catch { setError("Error al filtrar por etiqueta"); }
    finally { setLoading(false); }
  }, []);

  const updateStatus = useCallback(async (id: number, request: StatusUpdateRequest) => {
    await repairOrdersApi.updateStatus(id, request);
    await fetchOrders();  // refetch after status change
  }, [fetchOrders]);

  return {
    orders, loading, error,
    refetch: fetchOrders,
    searchOrders, filterByEmployee, filterByTag, updateStatus,
  };
}
```

#### `useRepairOrder.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { repairOrdersApi } from "@/api/repairOrders";
import type { RepairOrderDetailResponse, TitleUpdateRequest } from "../types";

export function useRepairOrder(id: number) {
  const [order, setOrder] = useState<RepairOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repairOrdersApi.getById(id);
      setOrder(res.data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden de trabajo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const updateTitle = useCallback(async (data: TitleUpdateRequest) => {
    await repairOrdersApi.updateTitle(id, data);
    await fetchOrder();
  }, [id, fetchOrder]);

  return { order, loading, error, refetch: fetchOrder, updateTitle };
}
```

---

### 5.5 Pages

#### `RepairOrdersPage.tsx` — Route: `/ordenes-trabajo`

Location: `src/pages/RepairOrdersPage.tsx`

```typescript
// Default export (page-level component, lazy loaded)
// Layout:
//   - Page title: "Órdenes de Trabajo" (Typography h4)
//   - Top bar:
//     - TextField: search input with placeholder "Buscar por título, nombre, patente, marca, modelo..."
//       Debounced (300ms), calls searchOrders(query) or refetch() when cleared
//     - Autocomplete/Select: filter by employee (loads from /api/employees)
//     - Autocomplete/Select: filter by tag (loads from /api/tags)
//     - Button: "Nueva Orden" (variant="contained", startIcon=<AddIcon />)
//       onClick → navigate("/ordenes-trabajo/nueva")
//   - KanbanBoard component (receives orders, loading, updateStatus handler)

export default function RepairOrdersPage() {
  const { orders, loading, error, refetch, searchOrders, filterByEmployee, filterByTag, updateStatus } = useRepairOrders();
  const navigate = useNavigate();

  // State for search query, employee filter, tag filter
  // Handlers for search, filter change, status update, navigation

  return (
    <Box>
      <Typography variant="h4">Órdenes de Trabajo</Typography>
      {/* Top bar with search + filters + "Nueva Orden" button */}
      <KanbanBoard orders={orders} loading={loading} onUpdateStatus={updateStatus} />
    </Box>
  );
}
```

#### `RepairOrderDetailPage.tsx` — Route: `/ordenes-trabajo/:id`

Location: `src/pages/RepairOrderDetailPage.tsx`

```typescript
// Default export (page-level component, lazy loaded)
// Reads :id from URL params
// Layout:
//   - Editable title at top:
//     - TextField (defaultValue=order.title, editable)
//     - Button "Guardar" next to it, calls updateTitle()
//   - RepairOrderDetailTabs component (5 tabs)

export default function RepairOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, error, updateTitle } = useRepairOrder(Number(id));

  // State: editableTitle, isEditingTitle
  // Handler: handleSaveTitle

  return (
    <Box>
      {/* Editable title row */}
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          value={editableTitle}
          onChange={(e) => setEditableTitle(e.target.value)}
          variant="outlined"
          fullWidth
          inputProps={{ maxLength: 255 }}
        />
        <Button variant="contained" onClick={handleSaveTitle}>Guardar</Button>
      </Box>
      <RepairOrderDetailTabs order={order} loading={loading} />
    </Box>
  );
}
```

#### `CreateRepairOrderPage.tsx` — Route: `/ordenes-trabajo/nueva`

Location: `src/pages/CreateRepairOrderPage.tsx`

```typescript
// Default export (page-level component, lazy loaded)
// Layout:
//   - Page title: "Nueva Orden de Trabajo" (Typography h4)
//   - CreateRepairOrderForm component
//   - On success → navigate to /ordenes-trabajo (Kanban board)

export default function CreateRepairOrderPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/ordenes-trabajo");
  };

  return (
    <Box>
      <Typography variant="h4">Nueva Orden de Trabajo</Typography>
      <CreateRepairOrderForm onSuccess={handleSuccess} />
    </Box>
  );
}
```

---

### 5.6 Components

All under `src/features/repair-orders/components/`.

#### `KanbanBoard.tsx`

Renders the 3-column Kanban layout.

```typescript
interface KanbanBoardProps {
  orders: RepairOrderResponse[];
  loading: boolean;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
}

export function KanbanBoard({ orders, loading, onUpdateStatus }: KanbanBoardProps) {
  // Groups orders into 3 columns based on KANBAN_COLUMNS mapping
  // Each column sorted by createdAt DESC (newest first)
  // Renders 3 KanbanColumn components side by side (Box display="flex" gap={2})

  const groupedOrders = KANBAN_COLUMNS.map((col) => ({
    ...col,
    orders: orders
      .filter((o) => col.statuses.includes(o.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }));

  return (
    <Box display="flex" gap={2} sx={{ overflowX: "auto", minHeight: "70vh" }}>
      {groupedOrders.map((col) => (
        <KanbanColumn
          key={col.title}
          title={col.title}
          orders={col.orders}
          loading={loading}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </Box>
  );
}
```

#### `KanbanColumn.tsx`

Renders a single Kanban column with title, count badge, and list of cards.

```typescript
interface KanbanColumnProps {
  title: string;
  orders: RepairOrderResponse[];
  loading: boolean;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
}

export function KanbanColumn({ title, orders, loading, onUpdateStatus }: KanbanColumnProps) {
  // Layout:
  //   - Paper with light background
  //   - Header: column title + count badge (Chip with orders.length)
  //   - Scrollable list of RepairOrderCard components
  //   - If loading: show Skeleton placeholders
  //   - If empty: show "Sin órdenes" message

  return (
    <Paper sx={{ flex: 1, minWidth: 320, maxWidth: 400, p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{title}</Typography>
        <Chip label={orders.length} size="small" />
      </Box>
      <Box sx={{ overflowY: "auto", maxHeight: "calc(100vh - 250px)" }}>
        {orders.map((order) => (
          <RepairOrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
        ))}
      </Box>
    </Paper>
  );
}
```

#### `RepairOrderCard.tsx`

Renders a single repair order card within a Kanban column.

```typescript
interface RepairOrderCardProps {
  order: RepairOrderResponse;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
}

export function RepairOrderCard({ order, onUpdateStatus }: RepairOrderCardProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const handleCardClick = () => {
    navigate(`/ordenes-trabajo/${order.id}`);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleCopyTrackingCode = () => {
    navigator.clipboard.writeText(String(order.id));
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setAnchorEl(null);
    navigate(`/ordenes-trabajo/${order.id}`);
  };

  // Card layout (inside a Card/Paper component, clickable):
  //   - Top row: Status badge (Chip with STATUS_LABELS[order.status]) + 3-dot menu (IconButton)
  //   - Order ID: "OT-{order.id}" (Typography variant="caption")
  //   - Client name: "{clientFirstName} {clientLastName}" (Typography variant="subtitle1")
  //   - Client phone: "{clientPhone}" (Typography variant="body2")
  //   - Vehicle: "{vehicleYear} {vehicleBrandName} {vehicleModel} | {vehiclePlate}" (Typography variant="body2")
  //   - Creation date: formatted createdAt (Typography variant="caption")
  //   - Assigned mechanic(s): employees list as chips
  //   - Tags: rendered as small colored chips

  return (
    <>
      <Card sx={{ mb: 1, cursor: "pointer" }} onClick={handleCardClick}>
        <CardContent>
          {/* Status badge + 3-dot menu */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Chip label={STATUS_LABELS[order.status]} size="small" variant="outlined" />
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>

          {/* Order ID */}
          <Typography variant="caption" color="text.secondary">
            OT-{order.id}
          </Typography>

          {/* Client name */}
          <Typography variant="subtitle2">
            {order.clientFirstName} {order.clientLastName}
          </Typography>

          {/* Client phone */}
          <Typography variant="body2" color="text.secondary">
            {order.clientPhone}
          </Typography>

          {/* Vehicle info */}
          <Typography variant="body2">
            {[order.vehicleYear, order.vehicleBrandName, order.vehicleModel]
              .filter(Boolean).join(" ")} | {order.vehiclePlate}
          </Typography>

          {/* Creation date */}
          <Typography variant="caption" color="text.secondary">
            {new Date(order.createdAt).toLocaleDateString("es-AR")}
          </Typography>

          {/* Assigned employees */}
          {order.employees.length > 0 && (
            <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
              {order.employees.map((emp) => (
                <Chip key={emp.id} label={`${emp.firstName} ${emp.lastName}`} size="small" />
              ))}
            </Box>
          )}

          {/* Tags */}
          {order.tags.length > 0 && (
            <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
              {order.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{ backgroundColor: tag.color || undefined }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 3-dot menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); setStatusDialogOpen(true); }}>
          Actualizar estado
        </MenuItem>
        <MenuItem onClick={handleCopyTrackingCode}>
          Copiar código de seguimiento
        </MenuItem>
        <MenuItem onClick={handleEditClick}>
          Editar
        </MenuItem>
      </Menu>

      {/* Status update dialog */}
      <StatusUpdateDialog
        open={statusDialogOpen}
        currentStatus={order.status}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={(newStatus) => {
          onUpdateStatus(order.id, { newStatus });
          setStatusDialogOpen(false);
        }}
      />
    </>
  );
}
```

#### `StatusUpdateDialog.tsx`

Modal for changing a repair order's status.

```typescript
interface StatusUpdateDialogProps {
  open: boolean;
  currentStatus: RepairOrderStatus;
  onClose: () => void;
  onConfirm: (newStatus: RepairOrderStatus) => void;
}

export function StatusUpdateDialog({ open, currentStatus, onClose, onConfirm }: StatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<RepairOrderStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Shows UPDATABLE_STATUSES (excludes INGRESO_VEHICULO and ESPERANDO_APROBACION_PRESUPUESTO)
  // Each status is a selectable option (RadioGroup or List of ListItemButton)
  // "Aceptar" button → opens confirmation alert
  // Confirmation alert: "¿Está seguro de cambiar de '{STATUS_LABELS[currentStatus]}' a '{STATUS_LABELS[selectedStatus]}'?"
  //   - "Confirmar" → calls onConfirm(selectedStatus)
  //   - "Cancelar" → closes confirmation

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Actualizar estado</DialogTitle>
      <DialogContent>
        <RadioGroup
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as RepairOrderStatus)}
        >
          {UPDATABLE_STATUSES.map((status) => (
            <FormControlLabel
              key={status}
              value={status}
              control={<Radio />}
              label={STATUS_LABELS[status]}
              disabled={status === currentStatus}
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!selectedStatus || selectedStatus === currentStatus}
          onClick={() => setConfirmOpen(true)}
        >
          Aceptar
        </Button>
      </DialogActions>

      {/* Confirmation alert dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar cambio de estado</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de cambiar de "{STATUS_LABELS[currentStatus]}" a "{selectedStatus ? STATUS_LABELS[selectedStatus] : ""}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={() => {
            if (selectedStatus) onConfirm(selectedStatus);
            setConfirmOpen(false);
          }}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
```

#### `RepairOrderDetailTabs.tsx`

Renders the 5-tab layout. Only the first tab is functional; the other 4 are placeholders.

```typescript
interface RepairOrderDetailTabsProps {
  order: RepairOrderDetailResponse | null;
  loading: boolean;
}

export function RepairOrderDetailTabs({ order, loading }: RepairOrderDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const TAB_LABELS = [
    "Información General",
    "Inspecciones",
    "Presupuesto",
    "Trabajos",
    "Factura",
  ];

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
        {TAB_LABELS.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {/* Tab content */}
      {activeTab === 0 && <GeneralInfoTab order={order} loading={loading} />}
      {activeTab === 1 && <PlaceholderTab />}
      {activeTab === 2 && <PlaceholderTab />}
      {activeTab === 3 && <PlaceholderTab />}
      {activeTab === 4 && <PlaceholderTab />}
    </Box>
  );
}
```

#### `PlaceholderTab.tsx`

Simple placeholder for the 4 tabs implemented in future specs.

```typescript
export function PlaceholderTab() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={300}
      sx={{ mt: 4 }}
    >
      <Typography variant="h6" color="text.secondary">
        Próximamente
      </Typography>
    </Box>
  );
}
```

#### `GeneralInfoTab.tsx`

The only fully functional tab in this spec. Displays client data, vehicle data, and work history.

```typescript
interface GeneralInfoTabProps {
  order: RepairOrderDetailResponse | null;
  loading: boolean;
}

export function GeneralInfoTab({ order, loading }: GeneralInfoTabProps) {
  if (loading) return <CircularProgress />;
  if (!order) return <Typography>No se encontró la orden de trabajo</Typography>;

  return (
    <Box sx={{ mt: 2 }}>
      {/* ---- Client Data (readonly) ---- */}
      <Typography variant="h6" gutterBottom>Datos del Cliente</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Nombre completo"
            value={`${order.clientFirstName} ${order.clientLastName}`}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="DNI"
            value={order.clientDni || "—"}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Teléfono"
            value={order.clientPhone}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Correo electrónico"
            value={order.clientEmail || "—"}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ---- Vehicle Data (readonly) ---- */}
      <Typography variant="h6" gutterBottom>Datos del Vehículo</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Vehículo"
            value={[order.vehicleYear, order.vehicleBrandName, order.vehicleModel]
              .filter(Boolean).join(" ") || "—"}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Patente"
            value={order.vehiclePlate}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Número de chasis"
            value={order.vehicleChassisNumber || "—"}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ---- Work History (DataGrid) ---- */}
      <Typography variant="h6" gutterBottom>Historial de Trabajo</Typography>
      <DataGrid
        rows={order.workHistory.map((entry) => ({
          id: entry.repairOrderId,
          ...entry,
        }))}
        columns={[
          {
            field: "createdAt",
            headerName: "Fecha",
            flex: 1,
            valueFormatter: (value: string) =>
              new Date(value).toLocaleDateString("es-AR"),
            sortable: true,
          },
          {
            field: "repairOrderId",
            headerName: "Orden de Trabajo",
            flex: 1,
            renderCell: (params) => (
              <Link href={`/ordenes-trabajo/${params.value}`} underline="hover">
                OT-{params.value}
              </Link>
            ),
          },
          {
            field: "reason",
            headerName: "Servicio / Motivo",
            flex: 2,
            valueGetter: (value: string | null) => value || "—",
          },
        ]}
        autoHeight
        disableRowSelectionOnClick
        initialState={{
          sorting: {
            sortModel: [{ field: "createdAt", sort: "desc" }],
          },
        }}
        pageSizeOptions={[5, 10]}
        sx={{ mt: 1 }}
      />
    </Box>
  );
}
```

#### `CreateRepairOrderForm.tsx`

Form for creating a new repair order with cascading client → vehicle dropdowns.

```typescript
interface CreateRepairOrderFormProps {
  onSuccess: () => void;
}

export function CreateRepairOrderForm({ onSuccess }: CreateRepairOrderFormProps) {
  // State
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data loading
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  // Load clients on mount
  useEffect(() => {
    clientsApi.getAll(0, 1000).then((res) => setClients(res.data.data.content));
  }, []);

  // Load vehicles when client changes
  useEffect(() => {
    if (selectedClientId) {
      vehiclesApi.getByClient(selectedClientId).then((res) => setVehicles(res.data.data));
    } else {
      setVehicles([]);
    }
    setSelectedVehicleId(null);  // Clear vehicle when client changes
  }, [selectedClientId]);

  const handleSubmit = async () => {
    if (!selectedClientId || !selectedVehicleId) return;
    setSubmitting(true);
    setError(null);
    try {
      await repairOrdersApi.create({
        clientId: selectedClientId,
        vehicleId: selectedVehicleId,
        reason: reason || null,
      });
      onSuccess();
    } catch (err: unknown) {
      setError("Error al crear la orden de trabajo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Client selection */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Autocomplete
          options={clients}
          getOptionLabel={(c) => `${c.firstName} ${c.lastName} — ${c.dni || "Sin DNI"}`}
          onChange={(_, value) => setSelectedClientId(value?.id ?? null)}
          renderInput={(params) => (
            <TextField {...params} label="Cliente" required />
          )}
          fullWidth
        />
        <Button variant="outlined" onClick={() => setClientModalOpen(true)}>
          Nuevo cliente
        </Button>
      </Box>

      {/* Vehicle selection (readonly until client is selected, clears on client change) */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Autocomplete
          options={vehicles}
          getOptionLabel={(v) =>
            `${[v.year, v.brandName, v.model].filter(Boolean).join(" ")} — ${v.plate}`
          }
          onChange={(_, value) => setSelectedVehicleId(value?.id ?? null)}
          value={vehicles.find((v) => v.id === selectedVehicleId) || null}
          disabled={!selectedClientId}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Vehículo"
              required
              helperText={!selectedClientId ? "Seleccione un cliente primero" : ""}
            />
          )}
          fullWidth
        />
        <Button
          variant="outlined"
          disabled={!selectedClientId}
          onClick={() => setVehicleModalOpen(true)}
        >
          Nuevo vehículo
        </Button>
      </Box>

      {/* Reason */}
      <TextField
        label="Motivo"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        multiline
        rows={4}
        fullWidth
        sx={{ mb: 2 }}
        inputProps={{ maxLength: 5000 }}
      />

      {/* Submit */}
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!selectedClientId || !selectedVehicleId || submitting}
        fullWidth
      >
        {submitting ? <CircularProgress size={24} /> : "Crear orden de trabajo"}
      </Button>

      {/* Client creation modal (reuses ClientForm from clients feature) */}
      {/* When client is created, add to clients list and auto-select */}
      {clientModalOpen && (
        <ClientForm
          open={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          onSave={(newClient) => {
            setClients((prev) => [...prev, newClient]);
            setSelectedClientId(newClient.id);
            setClientModalOpen(false);
          }}
        />
      )}

      {/* Vehicle creation modal (reuses VehicleForm from vehicles feature) */}
      {/* Pre-fills clientId, when vehicle is created, add to vehicles list and auto-select */}
      {vehicleModalOpen && selectedClientId && (
        <VehicleForm
          open={vehicleModalOpen}
          preSelectedClientId={selectedClientId}
          onClose={() => setVehicleModalOpen(false)}
          onSave={(newVehicle) => {
            setVehicles((prev) => [...prev, newVehicle]);
            setSelectedVehicleId(newVehicle.id);
            setVehicleModalOpen(false);
          }}
        />
      )}
    </Box>
  );
}
```

---

### 5.7 Routes

Add to `src/routes/`:

```typescript
const RepairOrdersPage = lazy(() => import("@/pages/RepairOrdersPage"));
const RepairOrderDetailPage = lazy(() => import("@/pages/RepairOrderDetailPage"));
const CreateRepairOrderPage = lazy(() => import("@/pages/CreateRepairOrderPage"));

// Route definitions:
{ path: "/ordenes-trabajo", element: <RepairOrdersPage /> }
{ path: "/ordenes-trabajo/:id", element: <RepairOrderDetailPage /> }
{ path: "/ordenes-trabajo/nueva", element: <CreateRepairOrderPage /> }
```

> **Important**: The `/ordenes-trabajo/nueva` route must be defined **before** `/ordenes-trabajo/:id` in the router config to prevent `nueva` from being interpreted as an `id` parameter.

---

## 6. Business Rules

| # | Rule | Implementation |
|---|------|----------------|
| 1 | **Status transitions: cannot go back to initial states** | `INGRESO_VEHICULO` and `ESPERANDO_APROBACION_PRESUPUESTO` cannot be set via the `updateStatus` endpoint. They are initial states only. The service throws `IllegalArgumentException` if attempted. The available statuses for manual update are: `ESPERANDO_REPUESTOS`, `REPARACION`, `PRUEBAS`, `LISTO_PARA_ENTREGAR`, `ENTREGADO`. |
| 2 | **Kanban column mapping** | Column **Presupuesto** = `INGRESO_VEHICULO` + `ESPERANDO_APROBACION_PRESUPUESTO`. Column **Trabajo en proceso** = `ESPERANDO_REPUESTOS` + `REPARACION` + `PRUEBAS`. Column **Completada** = `LISTO_PARA_ENTREGAR` + `ENTREGADO`. Each card shows its sub-status as a badge so the user can distinguish states within a column. |
| 3 | **Title auto-generation** | When a repair order is created, the title is auto-generated as `"OT-{id} {clientLastName} - {vehiclePlate}"`. The user can edit the title later via the detail view. |
| 4 | **Cascading client → vehicle on creation** | The vehicle dropdown is disabled until a client is selected. When the client changes, the vehicle selection is cleared and the vehicle list is refreshed to show only vehicles belonging to the new client. The backend validates that `vehicle.client_id == clientId`. |
| 5 | **Client and vehicle must exist** | Backend validates that `clientId` and `vehicleId` resolve to existing records. Throws `ResourceNotFoundException` (HTTP 404) if not found. |
| 6 | **Vehicle must belong to client** | Backend validates that the vehicle's `client_id` matches the request's `clientId`. Throws `IllegalArgumentException` (HTTP 400) with message "El vehículo no pertenece al cliente seleccionado". |
| 7 | **New client/vehicle from creation form** | The creation form has "Nuevo cliente" and "Nuevo vehículo" buttons that open modal forms (reusing existing `ClientForm` and `VehicleForm` components). After creation, the new record is auto-selected. |
| 8 | **Sort each Kanban column by creation date** | Each column's cards are sorted by `createdAt` descending (newest first). This is done client-side after fetching all orders. |
| 9 | **Search** | Text search across: `title`, `client.firstName`, `client.lastName`, `vehicle.plate`, `vehicle.brand.name`, `vehicle.model`. Case-insensitive partial match. |
| 10 | **Filter by employee** | Filter orders by assigned employee. Uses the `repair_order_employees` join table. |
| 11 | **Filter by tag** | Filter orders by assigned tag. Uses the `repair_order_tags` join table. |
| 12 | **Status update confirmation** | The `StatusUpdateDialog` shows a confirmation alert: "¿Está seguro de cambiar de '{oldStatus}' a '{newStatus}'?" before executing the change. |
| 13 | **Copy tracking code** | The 3-dot menu "Copiar código de seguimiento" copies the order ID to the clipboard. |
| 14 | **Default status** | New orders always start with `INGRESO_VEHICULO`. This is enforced by the entity `@Builder.Default` and the DB `DEFAULT` clause. |
| 15 | **Work history** | The "Información General" tab shows all repair orders for the same vehicle, sorted by date descending. Each entry links to its respective order detail page. |
| 16 | **Placeholder tabs** | Tabs "Inspecciones", "Presupuesto", "Trabajos", "Factura" display only "Próximamente". They will be filled in by specs 07, 08, 09, 10. |

---

## 7. Testing

### 7.1 Backend — Unit Tests

#### `RepairOrderServiceImplTest` (JUnit 5 + Mockito)

| Test Method | Description |
|---|---|
| `givenValidRequest_whenCreate_thenReturnCreatedOrder` | Happy path: creates order with auto-generated title `"OT-{id} {lastName} - {plate}"`. |
| `givenNonExistentClient_whenCreate_thenThrowResourceNotFoundException` | Client ID not found → 404. |
| `givenNonExistentVehicle_whenCreate_thenThrowResourceNotFoundException` | Vehicle ID not found → 404. |
| `givenVehicleNotBelongingToClient_whenCreate_thenThrowIllegalArgumentException` | Vehicle belongs to different client → 400. |
| `givenValidId_whenGetById_thenReturnDetailWithWorkHistory` | Returns detail response with work history populated. |
| `givenNonExistentId_whenGetById_thenThrowResourceNotFoundException` | Order not found → 404. |
| `givenValidRequest_whenUpdate_thenReturnUpdatedOrder` | Happy path: updates order fields, employees, tags. |
| `givenValidId_whenDelete_thenDeleteSuccessfully` | Happy path: deletes order. |
| `givenNonExistentId_whenDelete_thenThrowResourceNotFoundException` | Order not found → 404. |
| `givenValidStatus_whenUpdateStatus_thenReturnUpdatedOrder` | Changes status to `REPARACION` successfully. |
| `givenInitialStatus_whenUpdateStatus_thenThrowIllegalArgumentException` | Attempting to set `INGRESO_VEHICULO` → error. |
| `givenInitialStatus_whenUpdateStatusToEsperandoAprobacion_thenThrowIllegalArgumentException` | Attempting to set `ESPERANDO_APROBACION_PRESUPUESTO` → error. |
| `givenValidTitle_whenUpdateTitle_thenReturnUpdatedOrder` | Updates title successfully. |
| `givenStatusList_whenGetByStatus_thenReturnFilteredOrders` | Filters by multiple statuses. |
| `givenEmployeeIds_whenAssignEmployees_thenReturnOrderWithEmployees` | Assigns employees to order. |
| `givenTagIds_whenAssignTags_thenReturnOrderWithTags` | Assigns tags to order. |
| `givenQuery_whenSearch_thenReturnMatchingOrders` | Returns orders matching search query. |
| `givenEmployeeId_whenFilterByEmployee_thenReturnFilteredOrders` | Returns orders for specific employee. |
| `givenTagId_whenFilterByTag_thenReturnFilteredOrders` | Returns orders for specific tag. |
| `givenBlankQuery_whenSearch_thenReturnAllOrders` | Empty search returns all orders. |

#### `RepairOrderControllerTest` (`@WebMvcTest`)

| Test Method | Description |
|---|---|
| `getAll_returns200WithList` | GET `/api/repair-orders` → 200. |
| `getById_returns200WithDetail` | GET `/api/repair-orders/1` → 200. |
| `getById_nonExistentId_returns404` | GET `/api/repair-orders/999` → 404. |
| `create_validRequest_returns201` | POST with valid body → 201. |
| `create_missingClientId_returns400` | POST without `clientId` → 400 validation error. |
| `create_missingVehicleId_returns400` | POST without `vehicleId` → 400 validation error. |
| `update_validRequest_returns200` | PUT → 200. |
| `delete_existingId_returns200` | DELETE → 200. |
| `updateStatus_validStatus_returns200` | PATCH `/api/repair-orders/1/status` → 200. |
| `updateStatus_invalidStatus_returns400` | PATCH with `INGRESO_VEHICULO` → 400. |
| `updateTitle_validTitle_returns200` | PATCH `/api/repair-orders/1/title` → 200. |
| `updateTitle_blankTitle_returns400` | PATCH with blank title → 400. |
| `search_returns200` | GET `/api/repair-orders/search?query=test` → 200. |
| `assignEmployees_returns200` | PUT `/api/repair-orders/1/employees` → 200. |
| `assignTags_returns200` | PUT `/api/repair-orders/1/tags` → 200. |

#### `RepairOrderMapperTest`

| Test Method | Description |
|---|---|
| `toResponse_mapsAllFieldsIncludingNestedEmployeesAndTags` | Verifies full mapping to `RepairOrderResponse`. |
| `toDetailResponse_mapsAllFieldsExceptWorkHistory` | Verifies mapping to `RepairOrderDetailResponse` (workHistory is set by service). |
| `toEntity_ignoresAutoManagedFields` | Verifies `id`, `createdAt`, `updatedAt`, `title`, `status`, `client`, `vehicle`, `employees`, `tags` are all ignored. |
| `toEmployeeSummary_mapsCorrectly` | Maps employee to `EmployeeSummary`. |
| `toTagResponse_mapsCorrectly` | Maps tag to `TagResponse`. |

### 7.2 Backend — Integration Tests

#### `RepairOrderIntegrationTest` (`@SpringBootTest` + Testcontainers)

| Test Method | Description |
|---|---|
| `givenValidRequest_whenCreateOrder_thenReturn201` | POST `/api/repair-orders` → 201, title auto-generated. |
| `givenExistingOrder_whenGetById_thenReturn200WithWorkHistory` | GET returns detail with work history. |
| `givenExistingOrder_whenUpdateStatus_thenReturn200` | PATCH status change works. |
| `givenInitialStatus_whenUpdateStatus_thenReturn400` | PATCH to `INGRESO_VEHICULO` returns 400. |
| `givenExistingOrder_whenUpdateTitle_thenReturn200` | PATCH title change works. |
| `givenSearchQuery_whenSearch_thenReturnMatchingResults` | Search returns correct orders. |
| `fullCRUDFlow` | Create → Read → Update → Delete lifecycle. |

### 7.3 Frontend — Unit Tests (Vitest + React Testing Library)

| Test File | What it covers |
|---|---|
| `KanbanBoard.test.tsx` | Renders 3 columns with correct titles. Groups orders by status into correct columns. Shows loading state. |
| `KanbanColumn.test.tsx` | Renders column title and count badge. Shows cards sorted by date DESC. Shows "Sin órdenes" when empty. |
| `RepairOrderCard.test.tsx` | Renders order data: status badge, ID, client name, phone, vehicle info, date, employees, tags. 3-dot menu opens with correct actions. Click navigates to detail page. |
| `StatusUpdateDialog.test.tsx` | Shows only updatable statuses (excludes initial states). Disables current status. Shows confirmation dialog on "Aceptar". Calls onConfirm with selected status. |
| `RepairOrderDetailTabs.test.tsx` | Renders 5 tabs with correct labels. First tab shows GeneralInfoTab. Other 4 tabs show "Próximamente". Tab switching works. |
| `GeneralInfoTab.test.tsx` | Shows client data (name, DNI, phone, email) as readonly. Shows vehicle data (model, plate, chassis) as readonly. Shows work history DataGrid with date, order link, and reason. Default sort by date DESC. |
| `PlaceholderTab.test.tsx` | Renders "Próximamente" text. |
| `CreateRepairOrderForm.test.tsx` | Loads clients on mount. Vehicle dropdown disabled until client selected. Selecting client loads vehicles. Changing client clears vehicle selection. "Nuevo cliente" button opens modal. "Nuevo vehículo" button opens modal (disabled without client). Submit calls API with correct payload. Submit disabled without client+vehicle. |
| `useRepairOrders.test.ts` | Fetches orders on mount. `searchOrders` calls search API. `filterByEmployee` calls filter API. `filterByTag` calls filter API. `updateStatus` calls API and refetches. |
| `useRepairOrder.test.ts` | Fetches order detail on mount. `updateTitle` calls API and refetches. Handles loading/error states. |

---

## Appendix: File Checklist

### Backend (`backend/src/main/java/com/autotech/repairorder/`)

```
model/
  RepairOrder.java
  RepairOrderStatus.java
repository/
  RepairOrderRepository.java
dto/
  RepairOrderRequest.java
  RepairOrderResponse.java
  RepairOrderDetailResponse.java
  StatusUpdateRequest.java
  TitleUpdateRequest.java
  RepairOrderMapper.java
service/
  RepairOrderService.java
  RepairOrderServiceImpl.java
controller/
  RepairOrderController.java
```

### Backend Tests (`backend/src/test/java/com/autotech/repairorder/`)

```
service/
  RepairOrderServiceImplTest.java
controller/
  RepairOrderControllerTest.java
  RepairOrderIntegrationTest.java
dto/
  RepairOrderMapperTest.java
```

### Frontend (`frontend/src/`)

```
features/repair-orders/
  types.ts
  components/
    KanbanBoard.tsx
    KanbanColumn.tsx
    RepairOrderCard.tsx
    StatusUpdateDialog.tsx
    RepairOrderDetailTabs.tsx
    GeneralInfoTab.tsx
    PlaceholderTab.tsx
    CreateRepairOrderForm.tsx
  hooks/
    useRepairOrders.ts
    useRepairOrder.ts
api/
  repairOrders.ts
pages/
  RepairOrdersPage.tsx
  RepairOrderDetailPage.tsx
  CreateRepairOrderPage.tsx
```

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend

- [ ] Create `RepairOrderStatus` enum (`INGRESO_VEHICULO`, `ESPERANDO_APROBACION_PRESUPUESTO`, `ESPERANDO_REPUESTOS`, `REPARACION`, `PRUEBAS`, `LISTO_PARA_ENTREGAR`, `ENTREGADO`)
- [ ] Create `RepairOrder` entity with relationships to `Client` (ManyToOne), `Vehicle` (ManyToOne), `Appointment` (ManyToOne, optional), `Employee` (ManyToMany), `Tag` (ManyToMany)
- [ ] Create `RepairOrderRepository` with `findByStatusIn`, `findAllByOrderByCreatedAtDesc`, `findWithDetailsById`, `findByVehicleIdOrderByCreatedAtDesc`, `existsByVehicleIdAndStatusNot`, `search`, `findByEmployeeId`, `findByTagId`
- [ ] Create `RepairOrderRequest` record with Jakarta Validation (`@NotNull` on `clientId`/`vehicleId`, `@Size` on `reason`/`clientSource`)
- [ ] Create `RepairOrderResponse` record (with nested `EmployeeSummary`, `TagResponse`)
- [ ] Create `RepairOrderDetailResponse` record (with nested `WorkHistoryEntry`)
- [ ] Create `StatusUpdateRequest` record with Jakarta Validation (`@NotNull` on `newStatus`)
- [ ] Create `TitleUpdateRequest` record with Jakarta Validation (`@NotBlank`/`@Size` on `title`)
- [ ] Create `RepairOrderMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md)
- [ ] Create `RepairOrderService` interface
- [ ] Create `RepairOrderServiceImpl` with methods:
  - [ ] `getAll()` — list all ordered by createdAt DESC
  - [ ] `getById(Long)` — detail with work history
  - [ ] `create(RepairOrderRequest)` — resolve client/vehicle/appointment/employees/tags, auto-generate title
  - [ ] `update(Long, RepairOrderRequest)` — update fields, reconcile employees/tags
  - [ ] `delete(Long)` — delete repair order
  - [ ] `updateStatus(Long, StatusUpdateRequest)` — validate cannot go back to initial states
  - [ ] `updateTitle(Long, TitleUpdateRequest)` — update title
  - [ ] `getByStatus(List<RepairOrderStatus>)` — filter by statuses
  - [ ] `assignEmployees(Long, List<Long>)` — replace employee assignments
  - [ ] `assignTags(Long, List<Long>)` — replace tag assignments
  - [ ] `search(String)` — search by title, client name, plate, brand, model
  - [ ] `filterByEmployee(Long)` — filter by assigned employee
  - [ ] `filterByTag(Long)` — filter by assigned tag
- [ ] Create `RepairOrderController` with all endpoints:
  - [ ] `GET /api/repair-orders` — list all
  - [ ] `GET /api/repair-orders/{id}` — get detail
  - [ ] `POST /api/repair-orders` — create
  - [ ] `PUT /api/repair-orders/{id}` — update
  - [ ] `DELETE /api/repair-orders/{id}` — delete
  - [ ] `PATCH /api/repair-orders/{id}/status` — update status
  - [ ] `PATCH /api/repair-orders/{id}/title` — update title
  - [ ] `GET /api/repair-orders/by-status` — get by statuses
  - [ ] `PUT /api/repair-orders/{id}/employees` — assign employees
  - [ ] `PUT /api/repair-orders/{id}/tags` — assign tags
  - [ ] `GET /api/repair-orders/search` — search
  - [ ] `GET /api/repair-orders/filter/by-employee` — filter by employee
  - [ ] `GET /api/repair-orders/filter/by-tag` — filter by tag
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [ ] Create `src/features/repair-orders/types.ts` with types: `RepairOrderStatus`, `STATUS_LABELS`, `KANBAN_COLUMNS`, `UPDATABLE_STATUSES`, `EmployeeSummary`, `TagResponse`, `RepairOrderResponse`, `RepairOrderDetailResponse`, `WorkHistoryEntry`, `RepairOrderRequest`, `StatusUpdateRequest`, `TitleUpdateRequest`
- [ ] Create `src/api/repairOrders.ts` API layer (all repair order endpoints)
- [ ] Create `useRepairOrders` hook — fetch all, search, filter by employee/tag, update status
- [ ] Create `useRepairOrder` hook — fetch detail, update title
- [ ] Create `RepairOrdersPage` (`/ordenes-trabajo`) with search bar, employee/tag filters, "Nueva Orden" button, KanbanBoard
- [ ] Create `RepairOrderDetailPage` (`/ordenes-trabajo/:id`) with editable title and tabbed detail view
- [ ] Create `CreateRepairOrderPage` (`/ordenes-trabajo/nueva`) with CreateRepairOrderForm
- [ ] Create `KanbanBoard` component — 3-column layout grouping orders by status
- [ ] Create `KanbanColumn` component — column with title, count badge, scrollable card list
- [ ] Create `RepairOrderCard` component — card with status badge, order ID, client info, vehicle info, employees, tags, 3-dot menu
- [ ] Create `StatusUpdateDialog` component — radio group with updatable statuses and confirmation dialog
- [ ] Create `RepairOrderDetailTabs` component — 5 tabs (Información General + 4 placeholders)
- [ ] Create `GeneralInfoTab` component — readonly client/vehicle data + work history DataGrid
- [ ] Create `PlaceholderTab` component — displays "Próximamente"
- [ ] Create `CreateRepairOrderForm` component — cascading client→vehicle dropdowns, "Nuevo cliente"/"Nuevo vehículo" buttons, reason field
- [ ] Register routes with lazy loading:
  - [ ] `/ordenes-trabajo` → `RepairOrdersPage`
  - [ ] `/ordenes-trabajo/nueva` → `CreateRepairOrderPage` (before `:id` route)
  - [ ] `/ordenes-trabajo/:id` → `RepairOrderDetailPage`
- [ ] Verify frontend compiles
- [ ] Verify frontend runs

### 8.3 Business Rules Verification

- [ ] Status transitions: cannot go back to `INGRESO_VEHICULO` or `ESPERANDO_APROBACION_PRESUPUESTO` via `updateStatus`
- [ ] Kanban column mapping: Presupuesto = `INGRESO_VEHICULO` + `ESPERANDO_APROBACION_PRESUPUESTO`, Trabajo en proceso = `ESPERANDO_REPUESTOS` + `REPARACION` + `PRUEBAS`, Completada = `LISTO_PARA_ENTREGAR` + `ENTREGADO`
- [ ] Title auto-generation: `"OT-{id} {clientLastName} - {vehiclePlate}"` on creation
- [ ] Cascading client → vehicle: vehicle disabled until client selected, clears on client change, backend validates ownership
- [ ] Client and vehicle must exist (404 if not found)
- [ ] Vehicle must belong to client (400 if mismatch)
- [ ] New client/vehicle from creation form via modal reusing existing components
- [ ] Kanban columns sorted by `createdAt` DESC (newest first)
- [ ] Search across title, client name, plate, brand, model (case-insensitive partial match)
- [ ] Filter by assigned employee
- [ ] Filter by assigned tag
- [ ] Status update confirmation dialog before executing change
- [ ] Copy tracking code (order ID) to clipboard
- [ ] Default status: `INGRESO_VEHICULO` on creation
- [ ] Work history: all repair orders for the same vehicle, sorted by date DESC, linking to detail pages
- [ ] Placeholder tabs: "Inspecciones", "Presupuesto", "Trabajos", "Factura" display "Próximamente"

### 8.4 Testing

- [ ] `RepairOrderServiceImplTest` — unit tests (create with auto-title, non-existent client/vehicle, vehicle not belonging to client, getById with work history, update, delete, updateStatus valid/invalid, updateTitle, getByStatus, assignEmployees, assignTags, search, filterByEmployee, filterByTag, blank search returns all)
- [ ] `RepairOrderControllerTest` — MockMvc tests (getAll, getById, create valid/missing fields, update, delete, updateStatus valid/invalid, updateTitle valid/blank, search, assignEmployees, assignTags)
- [ ] `RepairOrderMapperTest` — mapping tests (toResponse, toDetailResponse, toEntity ignores auto-managed fields, toEmployeeSummary, toTagResponse)
- [ ] `RepairOrderIntegrationTest` — integration tests (create with auto-title, getById with work history, updateStatus valid/invalid, updateTitle, search, full CRUD flow)
- [ ] `KanbanBoard.test.tsx` — renders 3 columns, groups orders by status, shows loading
- [ ] `KanbanColumn.test.tsx` — renders title and count, cards sorted by date DESC, "Sin órdenes" when empty
- [ ] `RepairOrderCard.test.tsx` — renders all data fields, 3-dot menu actions, click navigates to detail
- [ ] `StatusUpdateDialog.test.tsx` — shows updatable statuses only, disables current, confirmation dialog, fires onConfirm
- [ ] `RepairOrderDetailTabs.test.tsx` — renders 5 tabs, first tab is GeneralInfoTab, others show "Próximamente"
- [ ] `GeneralInfoTab.test.tsx` — readonly client/vehicle data, work history DataGrid sorted by date DESC
- [ ] `PlaceholderTab.test.tsx` — renders "Próximamente"
- [ ] `CreateRepairOrderForm.test.tsx` — loads clients, cascading vehicle dropdown, new client/vehicle modals, submit payload, disabled without client+vehicle
- [ ] `useRepairOrders.test.ts` — fetch, search, filter, updateStatus refetch
- [ ] `useRepairOrder.test.ts` — fetch detail, updateTitle, loading/error states
