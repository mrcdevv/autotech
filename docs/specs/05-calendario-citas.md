# 05 — Calendario y Citas

## 1. Overview

This feature implements the **Calendar and Appointments** module for Autotech. It provides a visual calendar interface (day/week/month views) where workshop staff can schedule, view, edit, and manage appointments. Each appointment is optionally linked to a client, a vehicle, one or more employees, and one or more tags.

Key capabilities:

- **Calendar views**: day, week, and month with filter by employee.
- **Create appointment**: modal form with cascading client → vehicle dropdowns, tags, employees, and vehicle delivery method.
- **Appointment actions**: mark client arrived, mark vehicle arrived, mark vehicle picked up, edit (date/time only), delete, cancel, create repair order.
- **Calendar configuration**: default appointment duration (minutes), business start/end times.

**Dependencies**: Clients (`com.autotech.client`), Vehicles (`com.autotech.vehicle`), Employees (`com.autotech.employee`), Tags (`com.autotech.tag`).

---

## 2. Git

| Item | Value |
|------|-------|
| Branch | `feature/calendario-citas` |
| Base | `main` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:

- `feat: add Appointment entity with relationships`
- `feat: add appointment CRUD endpoints`
- `feat: add CalendarConfig entity and endpoints`
- `feat: add AppointmentsPage with calendar views`
- `feat: add AppointmentFormDialog with cascading dropdowns`
- `test: add unit tests for AppointmentService`

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. **No new migration needed.**

### 3.1 `tags`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE |
| `color` | `VARCHAR(7)` | nullable (hex color, e.g. `#FF5733`) |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.2 `appointments`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `BIGSERIAL` | PK |
| `title` | `VARCHAR(255)` | nullable |
| `client_id` | `BIGINT` | FK → `clients(id)`, nullable |
| `vehicle_id` | `BIGINT` | FK → `vehicles(id)`, nullable |
| `purpose` | `TEXT` | nullable |
| `start_time` | `TIMESTAMP` | NOT NULL |
| `end_time` | `TIMESTAMP` | NOT NULL |
| `vehicle_delivery_method` | `VARCHAR(20)` | CHECK (`PROPIO`, `GRUA`, `TERCERO`), nullable |
| `vehicle_arrived_at` | `TIMESTAMP` | nullable |
| `vehicle_picked_up_at` | `TIMESTAMP` | nullable |
| `client_arrived` | `BOOLEAN` | NOT NULL DEFAULT FALSE |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.3 `appointment_employees` (join table)

| Column | Type | Constraints |
|--------|------|-------------|
| `appointment_id` | `BIGINT` | FK → `appointments(id)` ON DELETE CASCADE, PK |
| `employee_id` | `BIGINT` | FK → `employees(id)` ON DELETE CASCADE, PK |

### 3.4 `appointment_tags` (join table)

| Column | Type | Constraints |
|--------|------|-------------|
| `appointment_id` | `BIGINT` | FK → `appointments(id)` ON DELETE CASCADE, PK |
| `tag_id` | `BIGINT` | FK → `tags(id)` ON DELETE CASCADE, PK |

### 3.5 `calendar_config`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `BIGSERIAL` | PK |
| `default_appointment_duration_minutes` | `INTEGER` | NOT NULL DEFAULT 60 |
| `start_time` | `TIME` | nullable (business day start) |
| `end_time` | `TIME` | nullable (business day end) |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.appointment/
├── controller/
│   ├── AppointmentController.java
│   └── CalendarConfigController.java
├── service/
│   ├── AppointmentService.java               (interface)
│   ├── AppointmentServiceImpl.java            (implementation)
│   ├── CalendarConfigService.java             (interface)
│   └── CalendarConfigServiceImpl.java         (implementation)
├── repository/
│   ├── AppointmentRepository.java
│   └── CalendarConfigRepository.java
├── model/
│   ├── Appointment.java
│   ├── CalendarConfig.java
│   └── VehicleDeliveryMethod.java             (enum)
└── dto/
    ├── AppointmentRequest.java
    ├── AppointmentResponse.java
    ├── AppointmentUpdateRequest.java
    ├── CalendarConfigRequest.java
    ├── CalendarConfigResponse.java
    └── AppointmentMapper.java
```

---

### 4.2 Enum — `VehicleDeliveryMethod`

```java
package com.autotech.appointment.model;

public enum VehicleDeliveryMethod {
    PROPIO,
    GRUA,
    TERCERO
}
```

---

### 4.3 Entities

#### `Appointment`

Location: `com.autotech.appointment.model.Appointment`

```java
@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Appointment extends BaseEntity {

    @Column(name = "title", length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "vehicle_delivery_method", length = 20)
    @Enumerated(EnumType.STRING)
    private VehicleDeliveryMethod vehicleDeliveryMethod;

    @Column(name = "vehicle_arrived_at")
    private LocalDateTime vehicleArrivedAt;

    @Column(name = "vehicle_picked_up_at")
    private LocalDateTime vehiclePickedUpAt;

    @Column(name = "client_arrived", nullable = false)
    @Builder.Default
    private Boolean clientArrived = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "appointment_employees",
        joinColumns = @JoinColumn(name = "appointment_id"),
        inverseJoinColumns = @JoinColumn(name = "employee_id")
    )
    @Builder.Default
    private Set<Employee> employees = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "appointment_tags",
        joinColumns = @JoinColumn(name = "appointment_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Appointment other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

#### `CalendarConfig`

Location: `com.autotech.appointment.model.CalendarConfig`

```java
@Entity
@Table(name = "calendar_config")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CalendarConfig extends BaseEntity {

    @Column(name = "default_appointment_duration_minutes", nullable = false)
    @Builder.Default
    private Integer defaultAppointmentDurationMinutes = 60;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;
}
```

---

### 4.4 Repositories

#### `AppointmentRepository`

Location: `com.autotech.appointment.repository.AppointmentRepository`

```java
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @EntityGraph(attributePaths = {"client", "vehicle", "employees", "tags"})
    Optional<Appointment> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"client", "vehicle", "employees", "tags"})
    Page<Appointment> findAll(Pageable pageable);

    @Query("""
        SELECT a FROM Appointment a
        WHERE a.startTime >= :rangeStart AND a.startTime < :rangeEnd
        ORDER BY a.startTime ASC
    """)
    @EntityGraph(attributePaths = {"client", "vehicle", "employees", "tags"})
    List<Appointment> findByDateRange(
        @Param("rangeStart") LocalDateTime rangeStart,
        @Param("rangeEnd") LocalDateTime rangeEnd
    );

    @Query("""
        SELECT DISTINCT a FROM Appointment a
        JOIN a.employees e
        WHERE e.id = :employeeId
          AND a.startTime >= :rangeStart
          AND a.startTime < :rangeEnd
        ORDER BY a.startTime ASC
    """)
    @EntityGraph(attributePaths = {"client", "vehicle", "employees", "tags"})
    List<Appointment> findByEmployeeAndDateRange(
        @Param("employeeId") Long employeeId,
        @Param("rangeStart") LocalDateTime rangeStart,
        @Param("rangeEnd") LocalDateTime rangeEnd
    );
}
```

#### `CalendarConfigRepository`

Location: `com.autotech.appointment.repository.CalendarConfigRepository`

```java
@Repository
public interface CalendarConfigRepository extends JpaRepository<CalendarConfig, Long> {

    default CalendarConfig getConfig() {
        return findAll().stream().findFirst()
                .orElseGet(() -> save(CalendarConfig.builder().build()));
    }
}
```

---

### 4.5 DTOs

#### `AppointmentRequest`

```java
public record AppointmentRequest(

    @Size(max = 255, message = "El título no puede superar los 255 caracteres")
    String title,

    Long clientId,

    Long vehicleId,

    @Size(max = 5000, message = "El propósito no puede superar los 5000 caracteres")
    String purpose,

    @NotNull(message = "La fecha y hora de inicio es obligatoria")
    LocalDateTime startTime,

    @NotNull(message = "La fecha y hora de fin es obligatoria")
    LocalDateTime endTime,

    VehicleDeliveryMethod vehicleDeliveryMethod,

    List<Long> employeeIds,

    List<Long> tagIds
) {}
```

#### `AppointmentUpdateRequest`

Used for editing an existing appointment (date/time only, per the requirement).

```java
public record AppointmentUpdateRequest(

    @NotNull(message = "La fecha y hora de inicio es obligatoria")
    LocalDateTime startTime,

    @NotNull(message = "La fecha y hora de fin es obligatoria")
    LocalDateTime endTime
) {}
```

#### `AppointmentResponse`

```java
public record AppointmentResponse(
    Long id,
    String title,
    Long clientId,
    String clientFullName,
    Long vehicleId,
    String vehiclePlate,
    String vehicleBrand,
    String vehicleModel,
    String purpose,
    LocalDateTime startTime,
    LocalDateTime endTime,
    VehicleDeliveryMethod vehicleDeliveryMethod,
    LocalDateTime vehicleArrivedAt,
    LocalDateTime vehiclePickedUpAt,
    Boolean clientArrived,
    List<EmployeeSummaryResponse> employees,
    List<TagResponse> tags,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

> **Nested DTOs** used inside `AppointmentResponse`:

```java
public record EmployeeSummaryResponse(
    Long id,
    String firstName,
    String lastName
) {}

public record TagResponse(
    Long id,
    String name,
    String color
) {}
```

#### `CalendarConfigRequest`

```java
public record CalendarConfigRequest(

    @NotNull(message = "La duración por defecto es obligatoria")
    @Min(value = 1, message = "La duración mínima es 1 minuto")
    Integer defaultAppointmentDurationMinutes,

    LocalTime startTime,

    LocalTime endTime
) {}
```

#### `CalendarConfigResponse`

```java
public record CalendarConfigResponse(
    Long id,
    Integer defaultAppointmentDurationMinutes,
    LocalTime startTime,
    LocalTime endTime,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

---

### 4.6 Mapper — `AppointmentMapper`

Location: `com.autotech.appointment.dto.AppointmentMapper`

```java
@Mapper(componentModel = "spring")
public interface AppointmentMapper {

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFullName", expression = "java(entity.getClient() != null ? entity.getClient().getFirstName() + \" \" + entity.getClient().getLastName() : null)")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehiclePlate", source = "vehicle.plate")
    @Mapping(target = "vehicleBrand", expression = "java(entity.getVehicle() != null && entity.getVehicle().getBrand() != null ? entity.getVehicle().getBrand().getName() : null)")
    @Mapping(target = "vehicleModel", source = "vehicle.model")
    AppointmentResponse toResponse(Appointment entity);

    EmployeeSummaryResponse toEmployeeSummaryResponse(Employee employee);

    TagResponse toTagResponse(Tag tag);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "client", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    @Mapping(target = "employees", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "vehicleArrivedAt", ignore = true)
    @Mapping(target = "vehiclePickedUpAt", ignore = true)
    @Mapping(target = "clientArrived", ignore = true)
    Appointment toEntity(AppointmentRequest request);

    CalendarConfigResponse toCalendarConfigResponse(CalendarConfig entity);
}
```

---

### 4.7 Services

#### `AppointmentService` (interface)

```java
public interface AppointmentService {

    Page<AppointmentResponse> getAll(Pageable pageable);

    AppointmentResponse getById(Long id);

    AppointmentResponse create(AppointmentRequest request);

    AppointmentResponse update(Long id, AppointmentUpdateRequest request);

    void delete(Long id);

    AppointmentResponse markClientArrived(Long id, boolean arrived);

    AppointmentResponse markVehicleArrived(Long id);

    AppointmentResponse markVehiclePickedUp(Long id);

    List<AppointmentResponse> getByDateRange(LocalDateTime rangeStart, LocalDateTime rangeEnd);

    List<AppointmentResponse> getByEmployeeAndDateRange(Long employeeId, LocalDateTime rangeStart, LocalDateTime rangeEnd);
}
```

#### `AppointmentServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final EmployeeRepository employeeRepository;
    private final TagRepository tagRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAll(Pageable pageable) {
        log.debug("Fetching all appointments, page: {}", pageable);
        return appointmentRepository.findAll(pageable)
                .map(appointmentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        log.debug("Fetching appointment with id {}", id);
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        return appointmentMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        // 1. Validate startTime < endTime
        validateTimeRange(request.startTime(), request.endTime());

        // 2. Map base fields
        Appointment entity = appointmentMapper.toEntity(request);

        // 3. Resolve client (optional)
        if (request.clientId() != null) {
            Client client = clientRepository.findById(request.clientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client", request.clientId()));
            entity.setClient(client);
        }

        // 4. Resolve vehicle (optional, must belong to client if client is set)
        if (request.vehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.vehicleId()));
            if (request.clientId() != null && !vehicle.getClient().getId().equals(request.clientId())) {
                throw new BusinessException("El vehículo no pertenece al cliente seleccionado");
            }
            entity.setVehicle(vehicle);
        }

        // 5. Resolve employees (optional)
        if (request.employeeIds() != null && !request.employeeIds().isEmpty()) {
            Set<Employee> employees = new HashSet<>(employeeRepository.findAllById(request.employeeIds()));
            if (employees.size() != request.employeeIds().size()) {
                throw new ResourceNotFoundException("Uno o más empleados no fueron encontrados");
            }
            entity.setEmployees(employees);
        }

        // 6. Resolve tags (optional)
        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            Set<Tag> tags = new HashSet<>(tagRepository.findAllById(request.tagIds()));
            if (tags.size() != request.tagIds().size()) {
                throw new ResourceNotFoundException("Una o más etiquetas no fueron encontradas");
            }
            entity.setTags(tags);
        }

        Appointment saved = appointmentRepository.save(entity);
        log.info("Created appointment with id {}", saved.getId());
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse update(Long id, AppointmentUpdateRequest request) {
        // Only date/time editable per business requirement
        validateTimeRange(request.startTime(), request.endTime());

        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        entity.setStartTime(request.startTime());
        entity.setEndTime(request.endTime());

        Appointment saved = appointmentRepository.save(entity);
        log.info("Updated appointment with id {}", saved.getId());
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Appointment", id);
        }
        appointmentRepository.deleteById(id);
        log.info("Deleted appointment with id {}", id);
    }

    @Override
    @Transactional
    public AppointmentResponse markClientArrived(Long id, boolean arrived) {
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        entity.setClientArrived(arrived);
        Appointment saved = appointmentRepository.save(entity);
        log.info("Marked client arrived = {} for appointment {}", arrived, id);
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse markVehicleArrived(Long id) {
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        entity.setVehicleArrivedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(entity);
        log.info("Marked vehicle arrived for appointment {}", id);
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse markVehiclePickedUp(Long id) {
        Appointment entity = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        entity.setVehiclePickedUpAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(entity);
        log.info("Marked vehicle picked up for appointment {}", id);
        return appointmentMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByDateRange(LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        log.debug("Fetching appointments from {} to {}", rangeStart, rangeEnd);
        return appointmentRepository.findByDateRange(rangeStart, rangeEnd).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByEmployeeAndDateRange(Long employeeId, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        log.debug("Fetching appointments for employee {} from {} to {}", employeeId, rangeStart, rangeEnd);
        return appointmentRepository.findByEmployeeAndDateRange(employeeId, rangeStart, rangeEnd).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    private void validateTimeRange(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && !start.isBefore(end)) {
            throw new BusinessException("La hora de inicio debe ser anterior a la hora de fin");
        }
    }
}
```

#### `CalendarConfigService` (interface)

```java
public interface CalendarConfigService {

    CalendarConfigResponse getConfig();

    CalendarConfigResponse updateConfig(CalendarConfigRequest request);
}
```

#### `CalendarConfigServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarConfigServiceImpl implements CalendarConfigService {

    private final CalendarConfigRepository calendarConfigRepository;
    private final AppointmentMapper appointmentMapper;

    @Override
    @Transactional(readOnly = true)
    public CalendarConfigResponse getConfig() {
        CalendarConfig config = calendarConfigRepository.getConfig();
        return appointmentMapper.toCalendarConfigResponse(config);
    }

    @Override
    @Transactional
    public CalendarConfigResponse updateConfig(CalendarConfigRequest request) {
        CalendarConfig config = calendarConfigRepository.getConfig();
        config.setDefaultAppointmentDurationMinutes(request.defaultAppointmentDurationMinutes());
        config.setStartTime(request.startTime());
        config.setEndTime(request.endTime());
        CalendarConfig saved = calendarConfigRepository.save(config);
        log.info("Updated calendar config: duration={}min, start={}, end={}",
                saved.getDefaultAppointmentDurationMinutes(), saved.getStartTime(), saved.getEndTime());
        return appointmentMapper.toCalendarConfigResponse(saved);
    }
}
```

---

### 4.8 Controllers

#### `AppointmentController`

Base path: `/api/appointments`

```
GET    /api/appointments?page={page}&size={size}&sort={sort}
GET    /api/appointments/{id}
POST   /api/appointments
PUT    /api/appointments/{id}
DELETE /api/appointments/{id}
PATCH  /api/appointments/{id}/client-arrived?arrived={boolean}
PATCH  /api/appointments/{id}/vehicle-arrived
PATCH  /api/appointments/{id}/vehicle-picked-up
GET    /api/appointments/range?start={ISO datetime}&end={ISO datetime}
GET    /api/appointments/range?start={ISO datetime}&end={ISO datetime}&employeeId={id}
```

```java
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AppointmentResponse>>> getAll(
            @PageableDefault(size = 12, sort = "startTime") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentResponse>> create(
            @Valid @RequestBody AppointmentRequest request) {
        AppointmentResponse created = appointmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Cita creada", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cita actualizada", appointmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Cita eliminada", null));
    }

    @PatchMapping("/{id}/client-arrived")
    public ResponseEntity<ApiResponse<AppointmentResponse>> markClientArrived(
            @PathVariable Long id,
            @RequestParam boolean arrived) {
        return ResponseEntity.ok(ApiResponse.success(
                arrived ? "Cliente marcado como presente" : "Cliente marcado como ausente",
                appointmentService.markClientArrived(id, arrived)));
    }

    @PatchMapping("/{id}/vehicle-arrived")
    public ResponseEntity<ApiResponse<AppointmentResponse>> markVehicleArrived(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Vehículo marcado como recibido",
                appointmentService.markVehicleArrived(id)));
    }

    @PatchMapping("/{id}/vehicle-picked-up")
    public ResponseEntity<ApiResponse<AppointmentResponse>> markVehiclePickedUp(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Vehículo marcado como retirado",
                appointmentService.markVehiclePickedUp(id)));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false) Long employeeId) {
        List<AppointmentResponse> appointments;
        if (employeeId != null) {
            appointments = appointmentService.getByEmployeeAndDateRange(employeeId, start, end);
        } else {
            appointments = appointmentService.getByDateRange(start, end);
        }
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }
}
```

#### `CalendarConfigController`

Base path: `/api/calendar-config`

```
GET    /api/calendar-config
PUT    /api/calendar-config
```

```java
@RestController
@RequestMapping("/api/calendar-config")
@RequiredArgsConstructor
public class CalendarConfigController {

    private final CalendarConfigService calendarConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<CalendarConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(calendarConfigService.getConfig()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<CalendarConfigResponse>> updateConfig(
            @Valid @RequestBody CalendarConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Configuración del calendario actualizada",
                calendarConfigService.updateConfig(request)));
    }
}
```

#### Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/appointments?page=0&size=12` | List all appointments (paginated) |
| `GET` | `/api/appointments/{id}` | Get appointment by ID |
| `POST` | `/api/appointments` | Create new appointment |
| `PUT` | `/api/appointments/{id}` | Update appointment (date/time only) |
| `DELETE` | `/api/appointments/{id}` | Delete appointment |
| `PATCH` | `/api/appointments/{id}/client-arrived?arrived=true` | Toggle client arrived |
| `PATCH` | `/api/appointments/{id}/vehicle-arrived` | Mark vehicle as arrived (sets timestamp) |
| `PATCH` | `/api/appointments/{id}/vehicle-picked-up` | Mark vehicle as picked up (sets timestamp) |
| `GET` | `/api/appointments/range?start=...&end=...` | Get appointments in date range |
| `GET` | `/api/appointments/range?start=...&end=...&employeeId=1` | Get appointments by employee and date range |
| `GET` | `/api/calendar-config` | Get calendar configuration |
| `PUT` | `/api/calendar-config` | Update calendar configuration |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   ├── appointments.ts
│   └── calendarConfig.ts
├── features/
│   └── appointments/
│       ├── components/
│       │   ├── CalendarView.tsx
│       │   ├── AppointmentFormDialog.tsx
│       │   ├── AppointmentCard.tsx
│       │   ├── AppointmentActions.tsx
│       │   └── AppointmentDetailDialog.tsx
│       └── hooks/
│           ├── useAppointments.ts
│           └── useCalendarConfig.ts
├── pages/
│   └── AppointmentsPage.tsx
└── types/
    └── appointment.ts
```

---

### 5.2 Types (`src/types/appointment.ts`)

```ts
// ---- Enums ----

export type VehicleDeliveryMethod = "PROPIO" | "GRUA" | "TERCERO";

export type CalendarViewMode = "day" | "week" | "month";

// ---- Appointment ----

export interface AppointmentResponse {
  id: number;
  title: string | null;
  clientId: number | null;
  clientFullName: string | null;
  vehicleId: number | null;
  vehiclePlate: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  purpose: string | null;
  startTime: string;       // ISO datetime
  endTime: string;         // ISO datetime
  vehicleDeliveryMethod: VehicleDeliveryMethod | null;
  vehicleArrivedAt: string | null;    // ISO datetime
  vehiclePickedUpAt: string | null;   // ISO datetime
  clientArrived: boolean;
  employees: EmployeeSummaryResponse[];
  tags: TagResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRequest {
  title: string | null;
  clientId: number | null;
  vehicleId: number | null;
  purpose: string | null;
  startTime: string;       // ISO datetime
  endTime: string;         // ISO datetime
  vehicleDeliveryMethod: VehicleDeliveryMethod | null;
  employeeIds: number[];
  tagIds: number[];
}

export interface AppointmentUpdateRequest {
  startTime: string;       // ISO datetime
  endTime: string;         // ISO datetime
}

// ---- Nested DTOs ----

export interface EmployeeSummaryResponse {
  id: number;
  firstName: string;
  lastName: string;
}

export interface TagResponse {
  id: number;
  name: string;
  color: string | null;
}

// ---- Calendar Config ----

export interface CalendarConfigResponse {
  id: number;
  defaultAppointmentDurationMinutes: number;
  startTime: string | null;    // HH:mm format
  endTime: string | null;      // HH:mm format
  createdAt: string;
  updatedAt: string;
}

export interface CalendarConfigRequest {
  defaultAppointmentDurationMinutes: number;
  startTime: string | null;    // HH:mm format
  endTime: string | null;      // HH:mm format
}
```

---

### 5.3 API Layer

#### `src/api/appointments.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { Page } from "@/types/pagination";
import type {
  AppointmentResponse,
  AppointmentRequest,
  AppointmentUpdateRequest,
} from "@/types/appointment";

export const appointmentsApi = {
  getAll: (page = 0, size = 12) =>
    apiClient.get<ApiResponse<Page<AppointmentResponse>>>("/appointments", {
      params: { page, size, sort: "startTime,asc" },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<AppointmentResponse>>(`/appointments/${id}`),

  create: (data: AppointmentRequest) =>
    apiClient.post<ApiResponse<AppointmentResponse>>("/appointments", data),

  update: (id: number, data: AppointmentUpdateRequest) =>
    apiClient.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/appointments/${id}`),

  markClientArrived: (id: number, arrived: boolean) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/client-arrived`,
      null,
      { params: { arrived } }
    ),

  markVehicleArrived: (id: number) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/vehicle-arrived`
    ),

  markVehiclePickedUp: (id: number) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/vehicle-picked-up`
    ),

  getByDateRange: (start: string, end: string, employeeId?: number) =>
    apiClient.get<ApiResponse<AppointmentResponse[]>>("/appointments/range", {
      params: { start, end, ...(employeeId ? { employeeId } : {}) },
    }),
};
```

#### `src/api/calendarConfig.ts`

```ts
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  CalendarConfigResponse,
  CalendarConfigRequest,
} from "@/types/appointment";

export const calendarConfigApi = {
  getConfig: () =>
    apiClient.get<ApiResponse<CalendarConfigResponse>>("/calendar-config"),

  updateConfig: (data: CalendarConfigRequest) =>
    apiClient.put<ApiResponse<CalendarConfigResponse>>("/calendar-config", data),
};
```

---

### 5.4 Hooks

#### `src/features/appointments/hooks/useAppointments.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { appointmentsApi } from "@/api/appointments";
import type {
  AppointmentResponse,
  AppointmentRequest,
  AppointmentUpdateRequest,
  CalendarViewMode,
} from "@/types/appointment";

export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(currentDate, viewMode);
      const res = await appointmentsApi.getByDateRange(
        start.toISOString(),
        end.toISOString(),
        employeeFilter ?? undefined
      );
      setAppointments(res.data.data);
    } catch (err) {
      setError("Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, employeeFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const createAppointment = async (data: AppointmentRequest) => {
    await appointmentsApi.create(data);
    await fetchAppointments();
  };

  const updateAppointment = async (id: number, data: AppointmentUpdateRequest) => {
    await appointmentsApi.update(id, data);
    await fetchAppointments();
  };

  const deleteAppointment = async (id: number) => {
    await appointmentsApi.delete(id);
    await fetchAppointments();
  };

  const markClientArrived = async (id: number, arrived: boolean) => {
    await appointmentsApi.markClientArrived(id, arrived);
    await fetchAppointments();
  };

  const markVehicleArrived = async (id: number) => {
    await appointmentsApi.markVehicleArrived(id);
    await fetchAppointments();
  };

  const markVehiclePickedUp = async (id: number) => {
    await appointmentsApi.markVehiclePickedUp(id);
    await fetchAppointments();
  };

  return {
    appointments, loading, error,
    viewMode, setViewMode,
    currentDate, setCurrentDate,
    employeeFilter, setEmployeeFilter,
    createAppointment, updateAppointment, deleteAppointment,
    markClientArrived, markVehicleArrived, markVehiclePickedUp,
    refetch: fetchAppointments,
  };
}

// Helper: compute start/end of the range based on view mode
function getDateRange(date: Date, mode: CalendarViewMode): { start: Date; end: Date } {
  const d = new Date(date);
  switch (mode) {
    case "day": {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
      return { start, end };
    }
    case "week": {
      const dayOfWeek = d.getDay();
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7, 0, 0, 0);
      return { start, end };
    }
    case "month": {
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0);
      return { start, end };
    }
  }
}
```

#### `src/features/appointments/hooks/useCalendarConfig.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { calendarConfigApi } from "@/api/calendarConfig";
import type { CalendarConfigResponse, CalendarConfigRequest } from "@/types/appointment";

export function useCalendarConfig() {
  const [config, setConfig] = useState<CalendarConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await calendarConfigApi.getConfig();
      setConfig(res.data.data);
    } catch (err) {
      setError("Error al cargar la configuración del calendario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const updateConfig = async (data: CalendarConfigRequest) => {
    await calendarConfigApi.updateConfig(data);
    await fetchConfig();
  };

  return { config, loading, error, updateConfig, refetch: fetchConfig };
}
```

---

### 5.5 Pages & Components

#### `AppointmentsPage` — route: `/calendario`

**UI Layout:**

- Page title: **"Calendario"**
- Toolbar row:
  - `ToggleButtonGroup` for view mode: **Día** / **Semana** / **Mes**
  - Date navigation: `IconButton` (← previous) + current date label + `IconButton` (→ next) + `Button` "Hoy"
  - `Autocomplete` employee filter: "Filtrar por empleado" (fetches from `/api/employees`)
  - `Button` (variant=contained): "Nueva cita" → opens `AppointmentFormDialog`
- `CalendarView` component occupying the main area

```tsx
// src/pages/AppointmentsPage.tsx
export default function AppointmentsPage() {
  const {
    appointments, loading, viewMode, setViewMode,
    currentDate, setCurrentDate, employeeFilter, setEmployeeFilter,
    createAppointment, updateAppointment, deleteAppointment,
    markClientArrived, markVehicleArrived, markVehiclePickedUp,
  } = useAppointments();

  const { config } = useCalendarConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);

  // Handlers: handleCreate, handleEdit, handleDelete, handleCardClick (opens detail),
  //           handleMarkClientArrived, handleMarkVehicleArrived, handleMarkVehiclePickedUp

  return (
    <Box>
      <Typography variant="h4">Calendario</Typography>
      {/* Toolbar */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)}>
          <ToggleButton value="day">Día</ToggleButton>
          <ToggleButton value="week">Semana</ToggleButton>
          <ToggleButton value="month">Mes</ToggleButton>
        </ToggleButtonGroup>
        {/* Date navigation */}
        {/* Employee filter Autocomplete */}
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          Nueva cita
        </Button>
      </Box>
      {/* Calendar */}
      <CalendarView
        appointments={appointments}
        viewMode={viewMode}
        currentDate={currentDate}
        loading={loading}
        onAppointmentClick={(apt) => { setSelectedAppointment(apt); setDetailOpen(true); }}
        onMarkClientArrived={markClientArrived}
        onMarkVehicleArrived={markVehicleArrived}
        onEdit={handleEdit}
        onDelete={deleteAppointment}
      />
      {/* Form dialog */}
      <AppointmentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={createAppointment}
        defaultDurationMinutes={config?.defaultAppointmentDurationMinutes ?? 60}
      />
      {/* Detail dialog */}
      <AppointmentDetailDialog
        open={detailOpen}
        appointment={selectedAppointment}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
}
```

---

#### `CalendarView` (`src/features/appointments/components/CalendarView.tsx`)

Renders appointments in a time-grid layout. Uses a **custom week/month grid** built with MUI `Box`, `Paper`, and `Grid` components. The approach:

- **Day view**: Single-column time grid from business start to end. Each appointment is positioned absolutely based on its `startTime`/`endTime`.
- **Week view**: 7-column grid (Sun–Sat) with time rows. Appointments rendered as positioned blocks.
- **Month view**: Standard calendar month grid with appointment chips inside each day cell.

```tsx
interface CalendarViewProps {
  appointments: AppointmentResponse[];
  viewMode: CalendarViewMode;
  currentDate: Date;
  loading: boolean;
  onAppointmentClick: (appointment: AppointmentResponse) => void;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

export function CalendarView({ appointments, viewMode, currentDate, loading, ... }: CalendarViewProps) {
  if (loading) return <CircularProgress />;

  switch (viewMode) {
    case "day":
      return <DayView appointments={appointments} date={currentDate} ... />;
    case "week":
      return <WeekView appointments={appointments} date={currentDate} ... />;
    case "month":
      return <MonthView appointments={appointments} date={currentDate} ... />;
  }
}
```

Each sub-view renders `AppointmentCard` for each appointment.

---

#### `AppointmentCard` (`src/features/appointments/components/AppointmentCard.tsx`)

A compact card displayed on the calendar for each appointment.

```tsx
interface AppointmentCardProps {
  appointment: AppointmentResponse;
  onClick: (appointment: AppointmentResponse) => void;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

export function AppointmentCard({ appointment, onClick, ... }: AppointmentCardProps) {
  return (
    <Paper
      sx={{ p: 0.5, cursor: "pointer", borderLeft: 3, borderColor: appointment.tags[0]?.color ?? "primary.main" }}
      onClick={() => onClick(appointment)}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="caption" fontWeight="bold">
            {appointment.title ?? `Cita #${appointment.id}`}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            {appointment.clientFullName}
          </Typography>
          {appointment.vehiclePlate && (
            <Typography variant="caption" display="block" color="text.secondary">
              {appointment.vehiclePlate}
            </Typography>
          )}
        </Box>
        <AppointmentActions
          appointment={appointment}
          onMarkClientArrived={onMarkClientArrived}
          onMarkVehicleArrived={onMarkVehicleArrived}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </Box>
      {/* Client arrived indicator */}
      {appointment.clientArrived && (
        <Chip label="Cliente presente" size="small" color="success" sx={{ mt: 0.5 }} />
      )}
    </Paper>
  );
}
```

---

#### `AppointmentActions` (`src/features/appointments/components/AppointmentActions.tsx`)

The 3-dot menu with available actions for an appointment.

```tsx
interface AppointmentActionsProps {
  appointment: AppointmentResponse;
  onMarkClientArrived: (id: number, arrived: boolean) => void;
  onMarkVehicleArrived: (id: number) => void;
  onEdit: (appointment: AppointmentResponse) => void;
  onDelete: (id: number) => void;
}

export function AppointmentActions({ appointment, ... }: AppointmentActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          onMarkClientArrived(appointment.id, !appointment.clientArrived);
          setAnchorEl(null);
        }}>
          {appointment.clientArrived ? "Desmarcar cliente presente" : "Marcar cliente presente"}
        </MenuItem>

        {!appointment.vehicleArrivedAt && (
          <MenuItem onClick={() => { onMarkVehicleArrived(appointment.id); setAnchorEl(null); }}>
            Marcar vehículo recibido
          </MenuItem>
        )}

        <MenuItem onClick={() => { onEdit(appointment); setAnchorEl(null); }}>
          Editar fecha y hora
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => { onDelete(appointment.id); setAnchorEl(null); }} sx={{ color: "error.main" }}>
          Eliminar cita
        </MenuItem>
      </Menu>
    </>
  );
}
```

---

#### `AppointmentFormDialog` (`src/features/appointments/components/AppointmentFormDialog.tsx`)

A MUI `Dialog` for creating a new appointment.

**Props:**

```tsx
interface AppointmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AppointmentRequest) => Promise<void>;
  defaultDurationMinutes: number;
}
```

**Dialog content:**

The form state includes `startTime`, `endTime`, `clientId`, `vehicleId`, `title`, `purpose`, `vehicleDeliveryMethod`, `employeeIds`, `tagIds`.

- **Start / End datetime**: Two `DateTimePicker` (from `@mui/x-date-pickers`). Default start = today at current hour rounded to the next 30 min. Default end = start + `defaultDurationMinutes` from backend.
- **Client section**:
  - `Autocomplete` "Cliente" — fetches clients from `/api/clients`. On selection, auto-fills readonly `TextField`s for: Nombre completo, Documento, Teléfono, Correo.
  - If client changes, clear vehicle selection and vehicle fields.
- **Vehicle section**:
  - `Autocomplete` "Vehículo" — fetches vehicles for the selected client from `/api/vehicles?clientId={id}`. Disabled if no client selected. On selection, auto-fills readonly `TextField`s for: Patente, Marca, Modelo.
- **Tags**: `Autocomplete` (multiple) — fetches tags from `/api/tags`. Set to `readOnly` if no tags exist.
- **Title**: `TextField` — placeholder: `"Cita #[id] - [clientName] - [plate]"` (generated when client/vehicle are selected; final title auto-set on backend response).
- **Purpose / Description**: `TextField` (multiline, 3 rows).
- **Employees**: `Autocomplete` (multiple) — fetches employees from `/api/employees`. Optional.
- **Vehicle delivery method**: `Select` with options: `(Ninguno)`, `Propio`, `Grúa`, `Tercero`. Optional.
- **Dialog actions**: `Button` "Cancelar" → closes dialog. `Button` "Guardar" → validates and calls `onSave`.

```tsx
export function AppointmentFormDialog({ open, onClose, onSave, defaultDurationMinutes }: AppointmentFormDialogProps) {
  // Form state
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [clientId, setClientId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vehicleDeliveryMethod, setVehicleDeliveryMethod] = useState<VehicleDeliveryMethod | "">("");
  const [employeeIds, setEmployeeIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);

  // Data fetching for dropdowns
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummaryResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);

  // On open: set default start/end
  useEffect(() => {
    if (open) {
      const now = dayjs();
      const roundedStart = now.minute(Math.ceil(now.minute() / 30) * 30).second(0);
      setStartTime(roundedStart);
      setEndTime(roundedStart.add(defaultDurationMinutes, "minute"));
    }
  }, [open, defaultDurationMinutes]);

  // Fetch clients on mount
  useEffect(() => { /* fetch clients */ }, []);

  // Fetch vehicles when clientId changes
  useEffect(() => {
    if (clientId) { /* fetch vehicles for clientId */ }
    else { setVehicles([]); setVehicleId(null); setSelectedVehicle(null); }
  }, [clientId]);

  // Fetch employees and tags on mount
  useEffect(() => { /* fetch employees */ }, []);
  useEffect(() => { /* fetch tags */ }, []);

  // On client change: clear vehicle
  const handleClientChange = (client: ClientResponse | null) => {
    setSelectedClient(client);
    setClientId(client?.id ?? null);
    setVehicleId(null);
    setSelectedVehicle(null);
  };

  // On vehicle change
  const handleVehicleChange = (vehicle: VehicleResponse | null) => {
    setSelectedVehicle(vehicle);
    setVehicleId(vehicle?.id ?? null);
  };

  const handleSave = async () => {
    if (!startTime || !endTime) return;
    await onSave({
      title: title || null,
      clientId,
      vehicleId,
      purpose: purpose || null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      vehicleDeliveryMethod: vehicleDeliveryMethod || null,
      employeeIds,
      tagIds,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Nueva cita</DialogTitle>
      <DialogContent dividers>
        {/* Start / End DateTimePickers */}
        {/* Client Autocomplete + readonly fields */}
        {/* Vehicle Autocomplete + readonly fields (disabled if no client) */}
        {/* Tags Autocomplete (multiple, readonly if empty) */}
        {/* Title TextField with placeholder */}
        {/* Purpose TextField (multiline) */}
        {/* Employees Autocomplete (multiple) */}
        {/* Vehicle delivery method Select */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

#### `AppointmentDetailDialog` (`src/features/appointments/components/AppointmentDetailDialog.tsx`)

A read-only dialog showing full appointment details when clicking on an appointment card.

```tsx
interface AppointmentDetailDialogProps {
  open: boolean;
  appointment: AppointmentResponse | null;
  onClose: () => void;
}

export function AppointmentDetailDialog({ open, appointment, onClose }: AppointmentDetailDialogProps) {
  if (!appointment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{appointment.title ?? `Cita #${appointment.id}`}</DialogTitle>
      <DialogContent dividers>
        {/* Date/time: startTime — endTime */}
        {/* Client info: name, DNI, phone, email */}
        {/* Vehicle info: plate, brand, model */}
        {/* Purpose */}
        {/* Tags as Chips */}
        {/* Employees list */}
        {/* Vehicle delivery method */}
        {/* Vehicle arrived at (timestamp or "Pendiente") */}
        {/* Vehicle picked up at (timestamp or "Pendiente") */}
        {/* Client arrived (Sí/No) */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

### 5.6 Routes

Location: `src/routes/`

```tsx
{ path: "/calendario", element: <AppointmentsPage /> }
```

Lazy loaded via `React.lazy`:

```tsx
const AppointmentsPage = lazy(() => import("@/pages/AppointmentsPage"));
```

---

## 6. Business Rules

| # | Rule | Implementation |
|---|------|----------------|
| 1 | **`startTime` must be before `endTime`** | Backend: validated in `AppointmentServiceImpl.validateTimeRange()`. Throws `BusinessException` with message "La hora de inicio debe ser anterior a la hora de fin". Frontend: `DateTimePicker` end min value = start value. |
| 2 | **Default appointment duration** | Backend: `calendar_config.default_appointment_duration_minutes` (default 60 min). Frontend: on form open, `endTime = startTime + defaultDurationMinutes` fetched from `/api/calendar-config`. |
| 3 | **Cascading client → vehicle** | Frontend: when a client is selected in the form, vehicle dropdown loads only that client's vehicles. If the client changes, vehicle selection and fields are cleared. Backend: validates that `vehicle.client.id == clientId` when both are provided. |
| 4 | **Tags readonly if none exist** | Frontend: if `/api/tags` returns an empty list, the tags `Autocomplete` is set to `readOnly`. |
| 5 | **Title placeholder** | Frontend: the title `TextField` has a placeholder like `"Cita #[id] - [clientName] - [plate]"`. The actual title is optional — if left blank, `null` is sent and the backend stores `null`. The UI falls back to `"Cita #[id]"` when displaying. |
| 6 | **Edit limited to date/time** | The `PUT /api/appointments/{id}` endpoint only accepts `AppointmentUpdateRequest` (startTime, endTime). All other fields are immutable after creation. |
| 7 | **Vehicle arrived / picked up are timestamps** | `PATCH .../vehicle-arrived` sets `vehicleArrivedAt = NOW()`. `PATCH .../vehicle-picked-up` sets `vehiclePickedUpAt = NOW()`. These are one-way actions (no undo). |
| 8 | **Client arrived is a boolean toggle** | `PATCH .../client-arrived?arrived=true/false` toggles the `clientArrived` field. Can be toggled back and forth. |
| 9 | **Vehicle must belong to client** | Backend: if both `clientId` and `vehicleId` are provided, the vehicle's `client.id` must match `clientId`. Otherwise, throws `BusinessException`. |
| 10 | **Employees and tags are optional** | Both ManyToMany relations allow empty sets. The form allows saving without selecting any employee or tag. |
| 11 | **Calendar config is a singleton** | The `calendar_config` table is expected to have exactly one row. `CalendarConfigRepository.getConfig()` returns the first row or creates a default one. |
| 12 | **Delete cascades join tables** | Deleting an appointment cascades to `appointment_employees` and `appointment_tags` (DB-level `ON DELETE CASCADE`). |

---

## 7. Testing

### 7.1 Backend — Unit Tests

#### Service layer tests (JUnit 5 + Mockito)

| Test Class | Test Methods |
|------------|--------------|
| `AppointmentServiceImplTest` | `getAll_returnsPagedResponse()`, `getById_existingId_returnsResponse()`, `getById_nonExistingId_throwsResourceNotFoundException()`, `create_validRequest_returnsResponse()`, `create_withClientAndVehicle_resolvesRelations()`, `create_vehicleNotBelongingToClient_throwsBusinessException()`, `create_startAfterEnd_throwsBusinessException()`, `create_withEmployeesAndTags_resolvesRelations()`, `create_withNonExistentEmployee_throwsException()`, `create_withNonExistentTag_throwsException()`, `update_existingId_updatesOnlyDateTime()`, `update_nonExistingId_throwsResourceNotFoundException()`, `delete_existingId_deletesSuccessfully()`, `delete_nonExistingId_throwsResourceNotFoundException()`, `markClientArrived_setsTrue()`, `markClientArrived_setsFalse()`, `markVehicleArrived_setsTimestamp()`, `markVehiclePickedUp_setsTimestamp()`, `getByDateRange_returnsFilteredList()`, `getByEmployeeAndDateRange_returnsFilteredList()` |
| `CalendarConfigServiceImplTest` | `getConfig_returnsExisting()`, `getConfig_createsDefaultIfNone()`, `updateConfig_updatesAllFields()` |

#### Controller layer tests (MockMvc + `@WebMvcTest`)

| Test Class | Test Methods |
|------------|--------------|
| `AppointmentControllerTest` | `getAll_returns200()`, `getById_returns200()`, `create_validRequest_returns201()`, `create_invalidRequest_returns400()` (missing startTime/endTime), `update_returns200()`, `delete_returns200()`, `markClientArrived_returns200()`, `markVehicleArrived_returns200()`, `markVehiclePickedUp_returns200()`, `getByDateRange_returns200()`, `getByDateRange_withEmployeeFilter_returns200()` |
| `CalendarConfigControllerTest` | `getConfig_returns200()`, `updateConfig_validRequest_returns200()`, `updateConfig_invalidRequest_returns400()` (null duration, duration < 1) |

#### Mapper tests

| Test Class | Test Methods |
|------------|--------------|
| `AppointmentMapperTest` | `toResponse_mapsAllFields()`, `toResponse_mapsClientFields()`, `toResponse_mapsVehicleFields()`, `toResponse_mapsEmployeesAndTags()`, `toResponse_handlesNullClient()`, `toResponse_handlesNullVehicle()`, `toEntity_ignoresRelations()`, `toCalendarConfigResponse_mapsAllFields()` |

### 7.2 Frontend — Unit Tests (Vitest + React Testing Library)

| Test File | What it covers |
|-----------|----------------|
| `CalendarView.test.tsx` | Renders day/week/month views, shows loading spinner, renders appointment cards, fires `onAppointmentClick` |
| `AppointmentCard.test.tsx` | Renders title, client name, plate, client arrived chip, fires `onClick` |
| `AppointmentActions.test.tsx` | Opens menu on 3-dot click, shows correct menu items, fires `onMarkClientArrived`, `onMarkVehicleArrived`, `onEdit`, `onDelete` |
| `AppointmentFormDialog.test.tsx` | Opens with default date/time, client dropdown populates, selecting client loads vehicles, changing client clears vehicle, tags readonly when empty, validates required fields (start/end), calls `onSave` with correct payload |
| `AppointmentDetailDialog.test.tsx` | Renders all appointment fields, shows "Pendiente" for null timestamps, shows "Sí"/"No" for client arrived |
| `useAppointments.test.ts` | Fetches appointments for current date range, handles view mode changes, handles employee filter, create/update/delete trigger refetch, markClientArrived/markVehicleArrived/markVehiclePickedUp trigger refetch |
| `useCalendarConfig.test.ts` | Fetches config on mount, handles loading/error states, updateConfig triggers refetch |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend

- [ ] Create `VehicleDeliveryMethod` enum (`PROPIO`, `GRUA`, `TERCERO`)
- [ ] Create `Appointment` entity with relationships to `Client`, `Vehicle`, `Employee` (ManyToMany), `Tag` (ManyToMany)
- [ ] Create `CalendarConfig` entity with `defaultAppointmentDurationMinutes`, `startTime`, `endTime`
- [ ] Create `AppointmentRepository` with `findWithDetailsById`, `findByDateRange`, `findByEmployeeAndDateRange`
- [ ] Create `CalendarConfigRepository` with `getConfig()` default method
- [ ] Create `AppointmentRequest` record with Jakarta Validation (`@NotNull` on `startTime`/`endTime`, `@Size` on `title`/`purpose`)
- [ ] Create `AppointmentUpdateRequest` record with Jakarta Validation (`@NotNull` on `startTime`/`endTime`)
- [ ] Create `AppointmentResponse` record (with nested `EmployeeSummaryResponse`, `TagResponse`)
- [ ] Create `CalendarConfigRequest` record with Jakarta Validation (`@NotNull`/`@Min` on `defaultAppointmentDurationMinutes`)
- [ ] Create `CalendarConfigResponse` record
- [ ] Create `AppointmentMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md)
- [ ] Create `AppointmentService` interface
- [ ] Create `AppointmentServiceImpl` with methods:
  - [ ] `getAll(Pageable)` — paginated list
  - [ ] `getById(Long)` — fetch with details
  - [ ] `create(AppointmentRequest)` — validate time range, resolve client/vehicle/employees/tags
  - [ ] `update(Long, AppointmentUpdateRequest)` — update date/time only
  - [ ] `delete(Long)` — delete appointment
  - [ ] `markClientArrived(Long, boolean)` — toggle client arrived
  - [ ] `markVehicleArrived(Long)` — set vehicleArrivedAt timestamp
  - [ ] `markVehiclePickedUp(Long)` — set vehiclePickedUpAt timestamp
  - [ ] `getByDateRange(LocalDateTime, LocalDateTime)` — filter by date range
  - [ ] `getByEmployeeAndDateRange(Long, LocalDateTime, LocalDateTime)` — filter by employee and date range
- [ ] Create `CalendarConfigService` interface
- [ ] Create `CalendarConfigServiceImpl` with methods:
  - [ ] `getConfig()` — get or create default config
  - [ ] `updateConfig(CalendarConfigRequest)` — update config fields
- [ ] Create `AppointmentController` with all endpoints:
  - [ ] `GET /api/appointments` — paginated list
  - [ ] `GET /api/appointments/{id}` — get by ID
  - [ ] `POST /api/appointments` — create
  - [ ] `PUT /api/appointments/{id}` — update (date/time only)
  - [ ] `DELETE /api/appointments/{id}` — delete
  - [ ] `PATCH /api/appointments/{id}/client-arrived` — toggle client arrived
  - [ ] `PATCH /api/appointments/{id}/vehicle-arrived` — mark vehicle arrived
  - [ ] `PATCH /api/appointments/{id}/vehicle-picked-up` — mark vehicle picked up
  - [ ] `GET /api/appointments/range` — get by date range (with optional employeeId filter)
- [ ] Create `CalendarConfigController` with endpoints:
  - [ ] `GET /api/calendar-config` — get config
  - [ ] `PUT /api/calendar-config` — update config
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [ ] Create `src/types/appointment.ts` with types: `VehicleDeliveryMethod`, `CalendarViewMode`, `AppointmentResponse`, `AppointmentRequest`, `AppointmentUpdateRequest`, `EmployeeSummaryResponse`, `TagResponse`, `CalendarConfigResponse`, `CalendarConfigRequest`
- [ ] Create `src/api/appointments.ts` API layer (all appointment endpoints)
- [ ] Create `src/api/calendarConfig.ts` API layer (get/update config)
- [ ] Create `useAppointments` hook — fetch by date range, CRUD operations, mark arrived/picked up
- [ ] Create `useCalendarConfig` hook — fetch and update config
- [ ] Create `AppointmentsPage` (`/calendario`) with toolbar (view toggle, date nav, employee filter, "Nueva cita" button)
- [ ] Create `CalendarView` component with day/week/month sub-views
- [ ] Create `AppointmentCard` component — compact card with title, client, plate, tags, client arrived chip
- [ ] Create `AppointmentActions` component — 3-dot menu with mark client arrived, mark vehicle arrived, edit, delete
- [ ] Create `AppointmentFormDialog` component — modal form with cascading client→vehicle dropdowns, tags, employees, delivery method, date pickers
- [ ] Create `AppointmentDetailDialog` component — read-only detail view with all appointment fields
- [ ] Register route `/calendario` with lazy loading
- [ ] Verify frontend compiles
- [ ] Verify frontend runs

### 8.3 Business Rules Verification

- [ ] `startTime` must be before `endTime` (backend validation + frontend DateTimePicker constraint)
- [ ] Default appointment duration from `calendar_config` applied on form open
- [ ] Cascading client → vehicle: vehicle dropdown loads only selected client's vehicles; clears on client change
- [ ] Tags `Autocomplete` set to `readOnly` if no tags exist
- [ ] Title placeholder: `"Cita #[id] - [clientName] - [plate]"` — optional, falls back to `"Cita #[id]"`
- [ ] Edit limited to date/time only (`PUT` accepts `AppointmentUpdateRequest`)
- [ ] Vehicle arrived / picked up are one-way timestamp actions
- [ ] Client arrived is a boolean toggle (can be toggled back and forth)
- [ ] Vehicle must belong to client when both are provided
- [ ] Employees and tags are optional (allow empty sets)
- [ ] Calendar config is a singleton (one row, created if missing)
- [ ] Delete cascades to `appointment_employees` and `appointment_tags` join tables

### 8.4 Testing

- [ ] `AppointmentServiceImplTest` — unit tests (getAll, getById, create, update, delete, markClientArrived, markVehicleArrived, markVehiclePickedUp, getByDateRange, getByEmployeeAndDateRange, validation errors)
- [ ] `CalendarConfigServiceImplTest` — unit tests (getConfig, updateConfig)
- [ ] `AppointmentControllerTest` — MockMvc tests (all endpoints, validation errors)
- [ ] `CalendarConfigControllerTest` — MockMvc tests (getConfig, updateConfig, validation errors)
- [ ] `AppointmentMapperTest` — mapping tests (toResponse, toEntity, nested DTOs, null handling)
- [ ] `CalendarView.test.tsx` — renders views, loading spinner, appointment cards
- [ ] `AppointmentCard.test.tsx` — renders title, client, plate, arrived chip
- [ ] `AppointmentActions.test.tsx` — menu items, action handlers
- [ ] `AppointmentFormDialog.test.tsx` — default dates, cascading dropdowns, tags readonly, validation, save payload
- [ ] `AppointmentDetailDialog.test.tsx` — renders all fields, handles null timestamps
- [ ] `useAppointments.test.ts` — fetch, view mode, employee filter, CRUD refetch
- [ ] `useCalendarConfig.test.ts` — fetch, loading/error, update refetch
