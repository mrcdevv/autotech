# 07 — Inspecciones

## 1. Overview

This feature covers two related areas:

1. **Inspection Templates (Configuration)** — Admin-level CRUD for reusable inspection checklists. Each template has a title, contains one or more **groups** (sections), and each group contains one or more **items** (checklist lines). Groups and items are orderable via `sort_order`. Templates can be duplicated. Also includes a **Common Problems** lookup table.

2. **Inspections within Repair Orders** — The "Inspecciones" tab inside the repair order detail view. A mechanic selects a template to create an inspection attached to the repair order. Each inspection item receives a status (`OK`, `REVISAR`, `PROBLEMA`, `NO_APLICA`) and an optional comment. The tab also exposes the repair order's `reason` and `mechanic_notes` fields for editing, plus a "Print inspection summary" button.

> **Dependency**: This spec fills the "Inspecciones" tab placeholder defined in spec `06-ordenes-reparacion.md`. The `repair_orders` table (with `reason` and `mechanic_notes` columns) must already exist.

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/inspecciones` |
| Base | `main` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add InspectionTemplate entity and repository`
- `feat: add inspection template CRUD endpoints`
- `feat: add InspectionsTab component for repair order detail`
- `feat: add InspectionForm with status radio buttons`
- `test: add unit tests for InspectionTemplateService`

---

## 3. DB Tables

All tables already exist in `V1__init_schema.sql`. No new migration needed.

### 3.1 `inspection_templates`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `title` | `VARCHAR(255)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.2 `inspection_template_groups`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `template_id` | `BIGINT` | FK → `inspection_templates(id)` ON DELETE CASCADE |
| `title` | `VARCHAR(255)` | NOT NULL |
| `sort_order` | `INTEGER` | NOT NULL DEFAULT 0 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.3 `inspection_template_items`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `group_id` | `BIGINT` | FK → `inspection_template_groups(id)` ON DELETE CASCADE |
| `name` | `VARCHAR(255)` | NOT NULL |
| `sort_order` | `INTEGER` | NOT NULL DEFAULT 0 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.4 `common_problems`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `description` | `TEXT` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.5 `inspections`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `repair_order_id` | `BIGINT` | FK → `repair_orders(id)` ON DELETE CASCADE |
| `template_id` | `BIGINT` | FK → `inspection_templates(id)` |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.6 `inspection_items`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `inspection_id` | `BIGINT` | FK → `inspections(id)` ON DELETE CASCADE |
| `template_item_id` | `BIGINT` | FK → `inspection_template_items(id)` |
| `status` | `VARCHAR(20)` | NOT NULL, CHECK (`OK`, `REVISAR`, `PROBLEMA`, `NO_APLICA`) |
| `comment` | `TEXT` | nullable |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

---

## 4. Backend

### 4.1 Package Structure

```
com.autotech.inspection/
├── controller/
│   ├── InspectionTemplateController.java
│   ├── CommonProblemController.java
│   └── InspectionController.java
├── service/
│   ├── InspectionTemplateService.java          (interface)
│   ├── InspectionTemplateServiceImpl.java      (implementation)
│   ├── CommonProblemService.java               (interface)
│   ├── CommonProblemServiceImpl.java           (implementation)
│   ├── InspectionService.java                  (interface)
│   └── InspectionServiceImpl.java              (implementation)
├── repository/
│   ├── InspectionTemplateRepository.java
│   ├── InspectionTemplateGroupRepository.java
│   ├── InspectionTemplateItemRepository.java
│   ├── CommonProblemRepository.java
│   ├── InspectionRepository.java
│   └── InspectionItemRepository.java
├── model/
│   ├── InspectionTemplate.java
│   ├── InspectionTemplateGroup.java
│   ├── InspectionTemplateItem.java
│   ├── CommonProblem.java
│   ├── Inspection.java
│   ├── InspectionItem.java
│   └── InspectionItemStatus.java               (enum)
└── dto/
    ├── InspectionTemplateRequest.java
    ├── InspectionTemplateResponse.java
    ├── InspectionTemplateGroupRequest.java
    ├── InspectionTemplateGroupResponse.java
    ├── InspectionTemplateItemRequest.java
    ├── InspectionTemplateItemResponse.java
    ├── CommonProblemRequest.java
    ├── CommonProblemResponse.java
    ├── InspectionResponse.java
    ├── InspectionItemRequest.java
    ├── InspectionItemResponse.java
    ├── InspectionTemplateMapper.java
    ├── CommonProblemMapper.java
    └── InspectionMapper.java
```

### 4.2 Enum — `InspectionItemStatus`

```java
package com.autotech.inspection.model;

public enum InspectionItemStatus {
    OK,
    REVISAR,
    PROBLEMA,
    NO_APLICA
}
```

### 4.3 Entities

#### `InspectionTemplate`

Location: `com.autotech.inspection.model.InspectionTemplate`

```java
@Entity
@Table(name = "inspection_templates")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InspectionTemplate extends BaseEntity {

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<InspectionTemplateGroup> groups = new ArrayList<>();
}
```

#### `InspectionTemplateGroup`

Location: `com.autotech.inspection.model.InspectionTemplateGroup`

```java
@Entity
@Table(name = "inspection_template_groups")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InspectionTemplateGroup extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private InspectionTemplate template;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<InspectionTemplateItem> items = new ArrayList<>();
}
```

#### `InspectionTemplateItem`

Location: `com.autotech.inspection.model.InspectionTemplateItem`

```java
@Entity
@Table(name = "inspection_template_items")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InspectionTemplateItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private InspectionTemplateGroup group;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
```

#### `CommonProblem`

Location: `com.autotech.inspection.model.CommonProblem`

```java
@Entity
@Table(name = "common_problems")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CommonProblem extends BaseEntity {

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;
}
```

#### `Inspection`

Location: `com.autotech.inspection.model.Inspection`

```java
@Entity
@Table(name = "inspections")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Inspection extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_order_id", nullable = false)
    private RepairOrder repairOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private InspectionTemplate template;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InspectionItem> items = new ArrayList<>();
}
```

#### `InspectionItem`

Location: `com.autotech.inspection.model.InspectionItem`

```java
@Entity
@Table(name = "inspection_items")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InspectionItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_item_id", nullable = false)
    private InspectionTemplateItem templateItem;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private InspectionItemStatus status;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
}
```

### 4.4 Repositories

#### `InspectionTemplateRepository`

```java
@Repository
public interface InspectionTemplateRepository extends JpaRepository<InspectionTemplate, Long> {

    @EntityGraph(attributePaths = {"groups", "groups.items"})
    Optional<InspectionTemplate> findWithGroupsAndItemsById(Long id);

    List<InspectionTemplate> findAllByOrderByTitleAsc();
}
```

#### `InspectionTemplateGroupRepository`

```java
@Repository
public interface InspectionTemplateGroupRepository extends JpaRepository<InspectionTemplateGroup, Long> {

    List<InspectionTemplateGroup> findByTemplateIdOrderBySortOrderAsc(Long templateId);

    @Query("SELECT COALESCE(MAX(g.sortOrder), -1) + 1 FROM InspectionTemplateGroup g WHERE g.template.id = :templateId")
    Integer findNextSortOrder(@Param("templateId") Long templateId);
}
```

#### `InspectionTemplateItemRepository`

```java
@Repository
public interface InspectionTemplateItemRepository extends JpaRepository<InspectionTemplateItem, Long> {

    List<InspectionTemplateItem> findByGroupIdOrderBySortOrderAsc(Long groupId);

    @Query("SELECT COALESCE(MAX(i.sortOrder), -1) + 1 FROM InspectionTemplateItem i WHERE i.group.id = :groupId")
    Integer findNextSortOrder(@Param("groupId") Long groupId);
}
```

#### `CommonProblemRepository`

```java
@Repository
public interface CommonProblemRepository extends JpaRepository<CommonProblem, Long> {

    List<CommonProblem> findAllByOrderByDescriptionAsc();
}
```

#### `InspectionRepository`

```java
@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    @EntityGraph(attributePaths = {"items", "items.templateItem", "template", "template.groups", "template.groups.items"})
    List<Inspection> findByRepairOrderId(Long repairOrderId);

    @EntityGraph(attributePaths = {"items", "items.templateItem", "template"})
    Optional<Inspection> findWithItemsById(Long id);
}
```

#### `InspectionItemRepository`

```java
@Repository
public interface InspectionItemRepository extends JpaRepository<InspectionItem, Long> {

    List<InspectionItem> findByInspectionId(Long inspectionId);
}
```

### 4.5 DTOs

#### Inspection Template DTOs

**`InspectionTemplateRequest`**

```java
public record InspectionTemplateRequest(

    @NotBlank(message = "El título de la plantilla es obligatorio")
    @Size(max = 255, message = "El título no debe superar los 255 caracteres")
    String title,

    @NotEmpty(message = "La plantilla debe tener al menos un grupo")
    @Valid
    List<InspectionTemplateGroupRequest> groups
) {}
```

**`InspectionTemplateGroupRequest`**

```java
public record InspectionTemplateGroupRequest(

    Long id,   // null for new groups, existing id for updates

    @NotBlank(message = "El título del grupo es obligatorio")
    @Size(max = 255, message = "El título del grupo no debe superar los 255 caracteres")
    String title,

    @NotNull(message = "El orden es obligatorio")
    Integer sortOrder,

    @NotEmpty(message = "El grupo debe tener al menos un ítem")
    @Valid
    List<InspectionTemplateItemRequest> items
) {}
```

**`InspectionTemplateItemRequest`**

```java
public record InspectionTemplateItemRequest(

    Long id,   // null for new items, existing id for updates

    @NotBlank(message = "El nombre del ítem es obligatorio")
    @Size(max = 255, message = "El nombre del ítem no debe superar los 255 caracteres")
    String name,

    @NotNull(message = "El orden es obligatorio")
    Integer sortOrder
) {}
```

**`InspectionTemplateResponse`**

```java
public record InspectionTemplateResponse(
    Long id,
    String title,
    List<InspectionTemplateGroupResponse> groups,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

**`InspectionTemplateGroupResponse`**

```java
public record InspectionTemplateGroupResponse(
    Long id,
    String title,
    Integer sortOrder,
    List<InspectionTemplateItemResponse> items
) {}
```

**`InspectionTemplateItemResponse`**

```java
public record InspectionTemplateItemResponse(
    Long id,
    String name,
    Integer sortOrder
) {}
```

#### Common Problem DTOs

**`CommonProblemRequest`**

```java
public record CommonProblemRequest(

    @NotBlank(message = "La descripción del problema es obligatoria")
    String description
) {}
```

**`CommonProblemResponse`**

```java
public record CommonProblemResponse(
    Long id,
    String description,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

#### Inspection DTOs

**`InspectionResponse`**

```java
public record InspectionResponse(
    Long id,
    Long repairOrderId,
    Long templateId,
    String templateTitle,
    List<InspectionGroupWithItemsResponse> groups,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

> **Note**: `groups` is a derived structure that nests inspection items under their template groups for easy UI rendering.

**`InspectionGroupWithItemsResponse`** (derived/virtual — not a direct entity mapping)

```java
public record InspectionGroupWithItemsResponse(
    Long groupId,
    String groupTitle,
    Integer sortOrder,
    List<InspectionItemResponse> items
) {}
```

**`InspectionItemResponse`**

```java
public record InspectionItemResponse(
    Long id,
    Long templateItemId,
    String templateItemName,
    InspectionItemStatus status,
    String comment
) {}
```

**`InspectionItemRequest`**

```java
public record InspectionItemRequest(

    @NotNull(message = "El ID del ítem es obligatorio")
    Long id,

    @NotNull(message = "El estado del ítem es obligatorio")
    InspectionItemStatus status,

    String comment
) {}
```

**`SaveInspectionItemsRequest`** (wrapper for batch update)

```java
public record SaveInspectionItemsRequest(

    @NotEmpty(message = "Debe incluir al menos un ítem")
    @Valid
    List<InspectionItemRequest> items
) {}
```

### 4.6 Mappers

#### `InspectionTemplateMapper`

Location: `com.autotech.inspection.dto.InspectionTemplateMapper`

```java
@Mapper(componentModel = "spring")
public interface InspectionTemplateMapper {

    InspectionTemplateResponse toResponse(InspectionTemplate entity);

    InspectionTemplateGroupResponse toGroupResponse(InspectionTemplateGroup entity);

    InspectionTemplateItemResponse toItemResponse(InspectionTemplateItem entity);

    List<InspectionTemplateResponse> toResponseList(List<InspectionTemplate> entities);
}
```

> **Note**: Creating entities from request DTOs is done manually in the service because of the parent-child relationships (setting `template` on groups, `group` on items).

#### `CommonProblemMapper`

Location: `com.autotech.inspection.dto.CommonProblemMapper`

```java
@Mapper(componentModel = "spring")
public interface CommonProblemMapper {

    CommonProblemResponse toResponse(CommonProblem entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CommonProblem toEntity(CommonProblemRequest request);

    List<CommonProblemResponse> toResponseList(List<CommonProblem> entities);
}
```

#### `InspectionMapper`

Location: `com.autotech.inspection.dto.InspectionMapper`

```java
@Mapper(componentModel = "spring")
public interface InspectionMapper {

    @Mapping(target = "repairOrderId", source = "repairOrder.id")
    @Mapping(target = "templateId", source = "template.id")
    @Mapping(target = "templateTitle", source = "template.title")
    @Mapping(target = "groups", ignore = true) // built manually in service
    InspectionResponse toResponse(Inspection entity);

    @Mapping(target = "templateItemId", source = "templateItem.id")
    @Mapping(target = "templateItemName", source = "templateItem.name")
    InspectionItemResponse toItemResponse(InspectionItem entity);
}
```

> **Note**: The `groups` field in `InspectionResponse` is assembled manually in the service by grouping `InspectionItem`s by their `templateItem.group`, then building `InspectionGroupWithItemsResponse` objects sorted by `sortOrder`.

### 4.7 Services

#### `InspectionTemplateService`

```java
public interface InspectionTemplateService {

    List<InspectionTemplateResponse> getAll();

    InspectionTemplateResponse getById(Long id);

    InspectionTemplateResponse create(InspectionTemplateRequest request);

    InspectionTemplateResponse update(Long id, InspectionTemplateRequest request);

    void delete(Long id);

    InspectionTemplateResponse duplicate(Long id);
}
```

**`InspectionTemplateServiceImpl`**

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class InspectionTemplateServiceImpl implements InspectionTemplateService {

    private final InspectionTemplateRepository templateRepository;
    private final InspectionTemplateMapper templateMapper;

    @Override
    @Transactional(readOnly = true)
    public List<InspectionTemplateResponse> getAll() {
        // Return all templates ordered by title ASC
        return templateMapper.toResponseList(templateRepository.findAllByOrderByTitleAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public InspectionTemplateResponse getById(Long id) {
        // Fetch with groups and items eagerly loaded
        InspectionTemplate template = templateRepository.findWithGroupsAndItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No se encontró la plantilla de inspección con ID " + id));
        return templateMapper.toResponse(template);
    }

    @Override
    @Transactional
    public InspectionTemplateResponse create(InspectionTemplateRequest request) {
        // 1. Create InspectionTemplate entity with title
        // 2. For each group in request:
        //    a. Create InspectionTemplateGroup, set template reference, title, sortOrder
        //    b. For each item in group:
        //       - Create InspectionTemplateItem, set group reference, name, sortOrder
        //       - Add item to group's items list
        //    c. Add group to template's groups list
        // 3. Save template (cascades to groups and items)
        // 4. Return response
    }

    @Override
    @Transactional
    public InspectionTemplateResponse update(Long id, InspectionTemplateRequest request) {
        // 1. Find existing template or throw ResourceNotFoundException
        // 2. Update title
        // 3. Reconcile groups:
        //    a. Collect existing group IDs from request (non-null id fields)
        //    b. Remove groups NOT in the request (orphanRemoval handles DB deletion)
        //    c. For each group in request:
        //       - If id is null → create new group
        //       - If id exists → update title, sortOrder
        //       - Reconcile items within each group the same way
        // 4. Save template
        // 5. Return response
    }

    @Override
    @Transactional
    public void delete(Long id) {
        // 1. Find template or throw ResourceNotFoundException
        // 2. Delete (CASCADE removes groups and items)
    }

    @Override
    @Transactional
    public InspectionTemplateResponse duplicate(Long id) {
        // 1. Find template with groups and items or throw ResourceNotFoundException
        // 2. Create a new InspectionTemplate with title = original.title + " (Copia)"
        // 3. Deep-copy all groups and items (new entities, no IDs)
        // 4. Save new template
        // 5. Return response
    }
}
```

#### `CommonProblemService`

```java
public interface CommonProblemService {

    List<CommonProblemResponse> getAll();

    CommonProblemResponse getById(Long id);

    CommonProblemResponse create(CommonProblemRequest request);

    CommonProblemResponse update(Long id, CommonProblemRequest request);

    void delete(Long id);
}
```

**`CommonProblemServiceImpl`**

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class CommonProblemServiceImpl implements CommonProblemService {

    private final CommonProblemRepository commonProblemRepository;
    private final CommonProblemMapper commonProblemMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CommonProblemResponse> getAll() {
        return commonProblemMapper.toResponseList(commonProblemRepository.findAllByOrderByDescriptionAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public CommonProblemResponse getById(Long id) {
        CommonProblem problem = commonProblemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No se encontró el problema común con ID " + id));
        return commonProblemMapper.toResponse(problem);
    }

    @Override
    @Transactional
    public CommonProblemResponse create(CommonProblemRequest request) {
        CommonProblem entity = commonProblemMapper.toEntity(request);
        return commonProblemMapper.toResponse(commonProblemRepository.save(entity));
    }

    @Override
    @Transactional
    public CommonProblemResponse update(Long id, CommonProblemRequest request) {
        CommonProblem existing = commonProblemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No se encontró el problema común con ID " + id));
        existing.setDescription(request.description());
        return commonProblemMapper.toResponse(commonProblemRepository.save(existing));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        CommonProblem existing = commonProblemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No se encontró el problema común con ID " + id));
        commonProblemRepository.delete(existing);
    }
}
```

#### `InspectionService`

```java
public interface InspectionService {

    InspectionResponse createForRepairOrder(Long repairOrderId, Long templateId);

    List<InspectionResponse> getByRepairOrder(Long repairOrderId);

    InspectionResponse getById(Long id);

    InspectionResponse saveItems(Long inspectionId, SaveInspectionItemsRequest request);

    void delete(Long id);
}
```

**`InspectionServiceImpl`**

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class InspectionServiceImpl implements InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionItemRepository inspectionItemRepository;
    private final InspectionTemplateRepository templateRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final InspectionMapper inspectionMapper;

    @Override
    @Transactional
    public InspectionResponse createForRepairOrder(Long repairOrderId, Long templateId) {
        // 1. Find repair order or throw ResourceNotFoundException
        RepairOrder repairOrder = repairOrderRepository.findById(repairOrderId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No se encontró la orden de reparación con ID " + repairOrderId));

        // 2. Find template with groups and items or throw ResourceNotFoundException
        InspectionTemplate template = templateRepository.findWithGroupsAndItemsById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No se encontró la plantilla de inspección con ID " + templateId));

        // 3. Create Inspection entity
        Inspection inspection = Inspection.builder()
            .repairOrder(repairOrder)
            .template(template)
            .build();

        // 4. For each template group → for each template item:
        //    Create InspectionItem with:
        //    - inspection = inspection
        //    - templateItem = the template item
        //    - status = NO_APLICA (default)
        //    - comment = null
        //    Add to inspection.items
        for (InspectionTemplateGroup group : template.getGroups()) {
            for (InspectionTemplateItem templateItem : group.getItems()) {
                InspectionItem item = InspectionItem.builder()
                    .inspection(inspection)
                    .templateItem(templateItem)
                    .status(InspectionItemStatus.NO_APLICA)
                    .build();
                inspection.getItems().add(item);
            }
        }

        // 5. Save inspection (cascades to items)
        inspection = inspectionRepository.save(inspection);

        // 6. Build and return response with grouped structure
        return buildResponse(inspection);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InspectionResponse> getByRepairOrder(Long repairOrderId) {
        // 1. Verify repair order exists
        if (!repairOrderRepository.existsById(repairOrderId)) {
            throw new ResourceNotFoundException(
                "No se encontró la orden de reparación con ID " + repairOrderId);
        }
        // 2. Fetch all inspections for this repair order with items eagerly
        List<Inspection> inspections = inspectionRepository.findByRepairOrderId(repairOrderId);
        // 3. Build grouped responses
        return inspections.stream().map(this::buildResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InspectionResponse getById(Long id) {
        Inspection inspection = inspectionRepository.findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No se encontró la inspección con ID " + id));
        return buildResponse(inspection);
    }

    @Override
    @Transactional
    public InspectionResponse saveItems(Long inspectionId, SaveInspectionItemsRequest request) {
        // 1. Find inspection or throw ResourceNotFoundException
        Inspection inspection = inspectionRepository.findWithItemsById(inspectionId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No se encontró la inspección con ID " + inspectionId));

        // 2. Build a map of existing items by ID for fast lookup
        Map<Long, InspectionItem> existingItems = inspection.getItems().stream()
            .collect(Collectors.toMap(BaseEntity::getId, Function.identity()));

        // 3. For each item in request:
        //    a. Find matching InspectionItem by id
        //    b. Update status and comment
        for (InspectionItemRequest itemRequest : request.items()) {
            InspectionItem item = existingItems.get(itemRequest.id());
            if (item == null) {
                throw new ResourceNotFoundException(
                    "No se encontró el ítem de inspección con ID " + itemRequest.id());
            }
            item.setStatus(itemRequest.status());
            item.setComment(itemRequest.comment());
        }

        // 4. Save inspection (cascades to items)
        inspection = inspectionRepository.save(inspection);

        // 5. Return grouped response
        return buildResponse(inspection);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Inspection inspection = inspectionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No se encontró la inspección con ID " + id));
        inspectionRepository.delete(inspection);
    }

    /**
     * Build InspectionResponse with items grouped by template group.
     */
    private InspectionResponse buildResponse(Inspection inspection) {
        // 1. Map all items to InspectionItemResponse
        // 2. Group items by their templateItem's group (templateItem.group.id)
        // 3. For each group, create InspectionGroupWithItemsResponse with:
        //    - groupId, groupTitle, sortOrder from the template group
        //    - items sorted by templateItem.sortOrder
        // 4. Sort groups by sortOrder
        // 5. Assemble InspectionResponse

        Map<Long, List<InspectionItem>> itemsByGroupId = inspection.getItems().stream()
            .collect(Collectors.groupingBy(item -> item.getTemplateItem().getGroup().getId()));

        List<InspectionGroupWithItemsResponse> groups = inspection.getTemplate().getGroups().stream()
            .filter(group -> itemsByGroupId.containsKey(group.getId()))
            .sorted(Comparator.comparing(InspectionTemplateGroup::getSortOrder))
            .map(group -> new InspectionGroupWithItemsResponse(
                group.getId(),
                group.getTitle(),
                group.getSortOrder(),
                itemsByGroupId.get(group.getId()).stream()
                    .sorted(Comparator.comparing(item -> item.getTemplateItem().getSortOrder()))
                    .map(inspectionMapper::toItemResponse)
                    .toList()
            ))
            .toList();

        InspectionResponse response = inspectionMapper.toResponse(inspection);
        // Since groups is ignored in mapper, we build manually:
        return new InspectionResponse(
            response.id(),
            response.repairOrderId(),
            response.templateId(),
            response.templateTitle(),
            groups,
            response.createdAt(),
            response.updatedAt()
        );
    }
}
```

### 4.8 Controllers

#### `InspectionTemplateController`

Location: `com.autotech.inspection.controller.InspectionTemplateController`

Base path: `/api/inspection-templates`

```java
@RestController
@RequestMapping("/api/inspection-templates")
@RequiredArgsConstructor
public class InspectionTemplateController {

    private final InspectionTemplateService inspectionTemplateService;

    // GET /api/inspection-templates
    @GetMapping
    public ResponseEntity<ApiResponse<List<InspectionTemplateResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(inspectionTemplateService.getAll()));
    }

    // GET /api/inspection-templates/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InspectionTemplateResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inspectionTemplateService.getById(id)));
    }

    // POST /api/inspection-templates
    @PostMapping
    public ResponseEntity<ApiResponse<InspectionTemplateResponse>> create(
            @Valid @RequestBody InspectionTemplateRequest request) {
        InspectionTemplateResponse created = inspectionTemplateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Plantilla de inspección creada", created));
    }

    // PUT /api/inspection-templates/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InspectionTemplateResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody InspectionTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Plantilla de inspección actualizada",
            inspectionTemplateService.update(id, request)));
    }

    // DELETE /api/inspection-templates/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        inspectionTemplateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Plantilla de inspección eliminada", null));
    }

    // POST /api/inspection-templates/{id}/duplicate
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<InspectionTemplateResponse>> duplicate(@PathVariable Long id) {
        InspectionTemplateResponse duplicated = inspectionTemplateService.duplicate(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Plantilla duplicada", duplicated));
    }
}
```

#### `CommonProblemController`

Location: `com.autotech.inspection.controller.CommonProblemController`

Base path: `/api/common-problems`

```java
@RestController
@RequestMapping("/api/common-problems")
@RequiredArgsConstructor
public class CommonProblemController {

    private final CommonProblemService commonProblemService;

    // GET /api/common-problems
    @GetMapping
    public ResponseEntity<ApiResponse<List<CommonProblemResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(commonProblemService.getAll()));
    }

    // GET /api/common-problems/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonProblemResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(commonProblemService.getById(id)));
    }

    // POST /api/common-problems
    @PostMapping
    public ResponseEntity<ApiResponse<CommonProblemResponse>> create(
            @Valid @RequestBody CommonProblemRequest request) {
        CommonProblemResponse created = commonProblemService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Problema común creado", created));
    }

    // PUT /api/common-problems/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonProblemResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CommonProblemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Problema común actualizado",
            commonProblemService.update(id, request)));
    }

    // DELETE /api/common-problems/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        commonProblemService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Problema común eliminado", null));
    }
}
```

#### `InspectionController`

Location: `com.autotech.inspection.controller.InspectionController`

Base path: `/api/repair-orders/{repairOrderId}/inspections`

```java
@RestController
@RequestMapping("/api/repair-orders/{repairOrderId}/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;

    // GET /api/repair-orders/{repairOrderId}/inspections
    @GetMapping
    public ResponseEntity<ApiResponse<List<InspectionResponse>>> getByRepairOrder(
            @PathVariable Long repairOrderId) {
        return ResponseEntity.ok(ApiResponse.success(inspectionService.getByRepairOrder(repairOrderId)));
    }

    // POST /api/repair-orders/{repairOrderId}/inspections?templateId={templateId}
    @PostMapping
    public ResponseEntity<ApiResponse<InspectionResponse>> create(
            @PathVariable Long repairOrderId,
            @RequestParam Long templateId) {
        InspectionResponse created = inspectionService.createForRepairOrder(repairOrderId, templateId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Inspección creada", created));
    }

    // GET /api/repair-orders/{repairOrderId}/inspections/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InspectionResponse>> getById(
            @PathVariable Long repairOrderId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inspectionService.getById(id)));
    }

    // PUT /api/repair-orders/{repairOrderId}/inspections/{id}/items
    @PutMapping("/{id}/items")
    public ResponseEntity<ApiResponse<InspectionResponse>> saveItems(
            @PathVariable Long repairOrderId,
            @PathVariable Long id,
            @Valid @RequestBody SaveInspectionItemsRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Inspección guardada",
            inspectionService.saveItems(id, request)));
    }

    // DELETE /api/repair-orders/{repairOrderId}/inspections/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long repairOrderId,
            @PathVariable Long id) {
        inspectionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Inspección eliminada", null));
    }
}
```

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/inspection-templates` | List all inspection templates |
| `GET` | `/api/inspection-templates/{id}` | Get template by ID (with groups and items) |
| `POST` | `/api/inspection-templates` | Create new template |
| `PUT` | `/api/inspection-templates/{id}` | Update template (reconcile groups/items) |
| `DELETE` | `/api/inspection-templates/{id}` | Delete template |
| `POST` | `/api/inspection-templates/{id}/duplicate` | Duplicate template |
| `GET` | `/api/common-problems` | List all common problems |
| `GET` | `/api/common-problems/{id}` | Get common problem by ID |
| `POST` | `/api/common-problems` | Create common problem |
| `PUT` | `/api/common-problems/{id}` | Update common problem |
| `DELETE` | `/api/common-problems/{id}` | Delete common problem |
| `GET` | `/api/repair-orders/{id}/inspections` | List inspections for a repair order |
| `POST` | `/api/repair-orders/{id}/inspections?templateId=X` | Create inspection from template |
| `GET` | `/api/repair-orders/{id}/inspections/{inspId}` | Get single inspection |
| `PUT` | `/api/repair-orders/{id}/inspections/{inspId}/items` | Save inspection item statuses |
| `DELETE` | `/api/repair-orders/{id}/inspections/{inspId}` | Delete inspection |

---

## 5. Frontend

### 5.1 Types

Location: `src/features/inspections/types.ts`

```typescript
// ── Inspection item status ──
type InspectionItemStatus = "OK" | "REVISAR" | "PROBLEMA" | "NO_APLICA";

// ── Template types ──
interface InspectionTemplateItemResponse {
  id: number;
  name: string;
  sortOrder: number;
}

interface InspectionTemplateGroupResponse {
  id: number;
  title: string;
  sortOrder: number;
  items: InspectionTemplateItemResponse[];
}

interface InspectionTemplateResponse {
  id: number;
  title: string;
  groups: InspectionTemplateGroupResponse[];
  createdAt: string;
  updatedAt: string;
}

interface InspectionTemplateItemRequest {
  id: number | null;
  name: string;
  sortOrder: number;
}

interface InspectionTemplateGroupRequest {
  id: number | null;
  title: string;
  sortOrder: number;
  items: InspectionTemplateItemRequest[];
}

interface InspectionTemplateRequest {
  title: string;
  groups: InspectionTemplateGroupRequest[];
}

// ── Common problem types ──
interface CommonProblemResponse {
  id: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CommonProblemRequest {
  description: string;
}

// ── Inspection types (within repair order) ──
interface InspectionItemResponse {
  id: number;
  templateItemId: number;
  templateItemName: string;
  status: InspectionItemStatus;
  comment: string | null;
}

interface InspectionGroupWithItemsResponse {
  groupId: number;
  groupTitle: string;
  sortOrder: number;
  items: InspectionItemResponse[];
}

interface InspectionResponse {
  id: number;
  repairOrderId: number;
  templateId: number;
  templateTitle: string;
  groups: InspectionGroupWithItemsResponse[];
  createdAt: string;
  updatedAt: string;
}

interface InspectionItemRequest {
  id: number;
  status: InspectionItemStatus;
  comment: string | null;
}

interface SaveInspectionItemsRequest {
  items: InspectionItemRequest[];
}
```

### 5.2 API

Location: `src/api/inspections.ts`

```typescript
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  InspectionTemplateResponse,
  InspectionTemplateRequest,
  CommonProblemResponse,
  CommonProblemRequest,
  InspectionResponse,
  SaveInspectionItemsRequest,
} from "@/features/inspections/types";

// ── Inspection Templates ──
export const inspectionTemplatesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<InspectionTemplateResponse[]>>("/inspection-templates"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<InspectionTemplateResponse>>(`/inspection-templates/${id}`),

  create: (data: InspectionTemplateRequest) =>
    apiClient.post<ApiResponse<InspectionTemplateResponse>>("/inspection-templates", data),

  update: (id: number, data: InspectionTemplateRequest) =>
    apiClient.put<ApiResponse<InspectionTemplateResponse>>(`/inspection-templates/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/inspection-templates/${id}`),

  duplicate: (id: number) =>
    apiClient.post<ApiResponse<InspectionTemplateResponse>>(`/inspection-templates/${id}/duplicate`),
};

// ── Common Problems ──
export const commonProblemsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<CommonProblemResponse[]>>("/common-problems"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<CommonProblemResponse>>(`/common-problems/${id}`),

  create: (data: CommonProblemRequest) =>
    apiClient.post<ApiResponse<CommonProblemResponse>>("/common-problems", data),

  update: (id: number, data: CommonProblemRequest) =>
    apiClient.put<ApiResponse<CommonProblemResponse>>(`/common-problems/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/common-problems/${id}`),
};

// ── Inspections (within Repair Orders) ──
export const inspectionsApi = {
  getByRepairOrder: (repairOrderId: number) =>
    apiClient.get<ApiResponse<InspectionResponse[]>>(
      `/repair-orders/${repairOrderId}/inspections`
    ),

  create: (repairOrderId: number, templateId: number) =>
    apiClient.post<ApiResponse<InspectionResponse>>(
      `/repair-orders/${repairOrderId}/inspections`,
      null,
      { params: { templateId } }
    ),

  getById: (repairOrderId: number, inspectionId: number) =>
    apiClient.get<ApiResponse<InspectionResponse>>(
      `/repair-orders/${repairOrderId}/inspections/${inspectionId}`
    ),

  saveItems: (repairOrderId: number, inspectionId: number, data: SaveInspectionItemsRequest) =>
    apiClient.put<ApiResponse<InspectionResponse>>(
      `/repair-orders/${repairOrderId}/inspections/${inspectionId}/items`,
      data
    ),

  delete: (repairOrderId: number, inspectionId: number) =>
    apiClient.delete<ApiResponse<void>>(
      `/repair-orders/${repairOrderId}/inspections/${inspectionId}`
    ),
};
```

### 5.3 Hooks

Location: `src/features/inspections/`

#### `useInspectionTemplates.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { inspectionTemplatesApi } from "@/api/inspections";
import type { InspectionTemplateResponse } from "@/features/inspections/types";

export function useInspectionTemplates() {
  const [templates, setTemplates] = useState<InspectionTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectionTemplatesApi.getAll();
      setTemplates(res.data.data);
    } catch {
      setError("Error al cargar plantillas de inspección");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}
```

#### `useInspectionTemplate.ts`

```typescript
import { useState, useEffect } from "react";
import { inspectionTemplatesApi } from "@/api/inspections";
import type { InspectionTemplateResponse } from "@/features/inspections/types";

export function useInspectionTemplate(id: number | null) {
  const [template, setTemplate] = useState<InspectionTemplateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) { setTemplate(null); return; }
    setLoading(true);
    inspectionTemplatesApi.getById(id)
      .then((res) => setTemplate(res.data.data))
      .catch(() => setError("Error al cargar la plantilla"))
      .finally(() => setLoading(false));
  }, [id]);

  return { template, loading, error };
}
```

#### `useCommonProblems.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { commonProblemsApi } from "@/api/inspections";
import type { CommonProblemResponse } from "@/features/inspections/types";

export function useCommonProblems() {
  const [problems, setProblems] = useState<CommonProblemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commonProblemsApi.getAll();
      setProblems(res.data.data);
    } catch {
      setError("Error al cargar problemas comunes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  return { problems, loading, error, refetch: fetchProblems };
}
```

#### `useRepairOrderInspections.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { inspectionsApi } from "@/api/inspections";
import type { InspectionResponse } from "@/features/inspections/types";

export function useRepairOrderInspections(repairOrderId: number) {
  const [inspections, setInspections] = useState<InspectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectionsApi.getByRepairOrder(repairOrderId);
      setInspections(res.data.data);
    } catch {
      setError("Error al cargar inspecciones");
    } finally {
      setLoading(false);
    }
  }, [repairOrderId]);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);

  return { inspections, loading, error, refetch: fetchInspections };
}
```

### 5.4 Components

#### `InspectionTemplateBuilder` (Config page)

Location: `src/features/inspections/InspectionTemplateBuilder.tsx`

Route: `/configuracion/plantillas-inspeccion` (nested under config section)

This is a **full-page builder** for creating/editing inspection templates.

```tsx
// Pseudo-structure
export default function InspectionTemplateBuilder() {
  // State: template title, groups (each with title, sortOrder, items)
  // Mode: create or edit (based on URL param :id)

  return (
    <Box>
      <Typography variant="h4">
        {isEditing ? "Editar Plantilla de Inspección" : "Nueva Plantilla de Inspección"}
      </Typography>

      {/* Template title */}
      <TextField label="Título de la plantilla" value={title} onChange={...} fullWidth />

      {/* Groups list — each group is a Card */}
      {groups.map((group, groupIndex) => (
        <Card key={group.id ?? groupIndex}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DragHandle />  {/* drag handle for reorder */}
              <TextField label="Título del grupo" value={group.title} onChange={...} />
              <IconButton onClick={() => removeGroup(groupIndex)}>
                <DeleteIcon />
              </IconButton>
            </Stack>

            {/* Items within group */}
            {group.items.map((item, itemIndex) => (
              <Stack key={item.id ?? itemIndex} direction="row" alignItems="center" spacing={1}>
                <DragHandle />
                <TextField label="Nombre del ítem" value={item.name} onChange={...} />
                <IconButton onClick={() => removeItem(groupIndex, itemIndex)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}

            <Button startIcon={<AddIcon />} onClick={() => addItem(groupIndex)}>
              Agregar ítem
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button startIcon={<AddIcon />} onClick={addGroup}>
        Agregar grupo
      </Button>

      {/* Actions */}
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={handleCancel}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </Stack>
    </Box>
  );
}
```

**Key behaviors**:
- Groups and items can be reordered via drag-and-drop. `sortOrder` is derived from position in the array.
- Removing a group or item marks it for deletion; changes are not persisted until the user clicks **Guardar** (save).
- On save, the entire template (title + all groups + all items) is sent as a single `InspectionTemplateRequest` to `POST` (create) or `PUT` (update).

#### `InspectionTemplateListPage` (Config page)

Location: `src/features/inspections/InspectionTemplateListPage.tsx`

Route: `/configuracion/plantillas-inspeccion`

```tsx
export default function InspectionTemplateListPage() {
  const { templates, loading, refetch } = useInspectionTemplates();

  return (
    <Box>
      <Typography variant="h4">Plantillas de Inspección</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={navigateToCreate}>
        Nueva Plantilla
      </Button>

      {/* List of templates */}
      {templates.map((template) => (
        <Card key={template.id}>
          <CardContent>
            <Typography variant="h6">{template.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {template.groups.length} grupo(s)
            </Typography>
          </CardContent>
          <CardActions>
            <IconButton onClick={() => navigateToEdit(template.id)}><EditIcon /></IconButton>
            <IconButton onClick={() => handleDuplicate(template.id)}><ContentCopyIcon /></IconButton>
            <IconButton onClick={() => handleDelete(template.id)} color="error"><DeleteIcon /></IconButton>
          </CardActions>
        </Card>
      ))}
    </Box>
  );
}
```

#### `CommonProblemsPage` (Config page)

Location: `src/features/inspections/CommonProblemsPage.tsx`

Route: `/configuracion/problemas-comunes`

Simple CRUD list with inline add/edit dialog.

```tsx
export default function CommonProblemsPage() {
  const { problems, loading, refetch } = useCommonProblems();
  // State: dialogOpen, selectedProblem, description

  return (
    <Box>
      <Typography variant="h4">Problemas Comunes</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
        Nuevo Problema
      </Button>

      <List>
        {problems.map((problem) => (
          <ListItem key={problem.id}
            secondaryAction={
              <>
                <IconButton onClick={() => openEditDialog(problem)}><EditIcon /></IconButton>
                <IconButton onClick={() => handleDelete(problem.id)} color="error"><DeleteIcon /></IconButton>
              </>
            }>
            <ListItemText primary={problem.description} />
          </ListItem>
        ))}
      </List>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>{selectedProblem ? "Editar Problema" : "Nuevo Problema"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

#### `InspectionsTab` (Repair Order detail — fills the "Inspecciones" tab)

Location: `src/features/inspections/InspectionsTab.tsx`

This component replaces the placeholder in the repair order detail view's tab panel.

```tsx
interface InspectionsTabProps {
  repairOrderId: number;
  reason: string | null;
  mechanicNotes: string | null;
  onUpdateRepairOrder: (fields: { reason?: string; mechanicNotes?: string }) => void;
}

export default function InspectionsTab({
  repairOrderId,
  reason,
  mechanicNotes,
  onUpdateRepairOrder,
}: InspectionsTabProps) {
  const { inspections, loading, refetch } = useRepairOrderInspections(repairOrderId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [localReason, setLocalReason] = useState(reason ?? "");
  const [localNotes, setLocalNotes] = useState(mechanicNotes ?? "");

  const handleSaveReasonAndNotes = () => {
    onUpdateRepairOrder({ reason: localReason, mechanicNotes: localNotes });
  };

  const handleAddInspection = async (templateId: number) => {
    await inspectionsApi.create(repairOrderId, templateId);
    refetch();
    setAddDialogOpen(false);
  };

  const handlePrint = () => {
    window.print(); // or generate PDF — basic implementation
  };

  return (
    <Box>
      {/* Reason and Mechanic Notes */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Motivo de consulta"
          value={localReason}
          onChange={(e) => setLocalReason(e.target.value)}
          multiline
          rows={2}
          fullWidth
        />
        <TextField
          label="Notas del mecánico"
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          multiline
          rows={2}
          fullWidth
        />
        <Button variant="outlined" onClick={handleSaveReasonAndNotes}>
          Guardar motivo y notas
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Actions bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          disabled={inspections.length === 0}
          onClick={handlePrint}
        >
          Imprimir resumen
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Agregar inspección
        </Button>
      </Stack>

      {/* Inspections list */}
      {loading && <CircularProgress />}
      {!loading && inspections.length === 0 && (
        <Typography color="text.secondary">No existen inspecciones</Typography>
      )}
      {inspections.map((inspection) => (
        <InspectionForm
          key={inspection.id}
          repairOrderId={repairOrderId}
          inspection={inspection}
          onSaved={refetch}
          onDeleted={refetch}
        />
      ))}

      {/* Add Inspection Dialog */}
      <AddInspectionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSelect={handleAddInspection}
      />
    </Box>
  );
}
```

#### `InspectionForm` (Per-inspection form with status radio buttons)

Location: `src/features/inspections/InspectionForm.tsx`

```tsx
interface InspectionFormProps {
  repairOrderId: number;
  inspection: InspectionResponse;
  onSaved: () => void;
  onDeleted: () => void;
}

export default function InspectionForm({
  repairOrderId,
  inspection,
  onSaved,
  onDeleted,
}: InspectionFormProps) {
  // Local state: map of itemId → { status, comment }
  const [itemStates, setItemStates] = useState<
    Record<number, { status: InspectionItemStatus; comment: string | null }>
  >(() => {
    // Initialize from inspection data
    const map: Record<number, { status: InspectionItemStatus; comment: string | null }> = {};
    inspection.groups.forEach((group) => {
      group.items.forEach((item) => {
        map[item.id] = { status: item.status, comment: item.comment };
      });
    });
    return map;
  });

  const handleStatusChange = (itemId: number, status: InspectionItemStatus) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], status },
    }));
  };

  const handleCommentChange = (itemId: number, comment: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment: comment || null },
    }));
  };

  const handleSave = async () => {
    const items: InspectionItemRequest[] = Object.entries(itemStates).map(([id, state]) => ({
      id: Number(id),
      status: state.status,
      comment: state.comment,
    }));
    await inspectionsApi.saveItems(repairOrderId, inspection.id, { items });
    onSaved();
  };

  const handleDelete = async () => {
    await inspectionsApi.delete(repairOrderId, inspection.id);
    onDeleted();
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{inspection.templateTitle}</Typography>
          <IconButton onClick={handleDelete} color="error"><DeleteIcon /></IconButton>
        </Stack>

        {inspection.groups.map((group) => (
          <Box key={group.groupId} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">{group.groupTitle}</Typography>

            {group.items.map((item) => (
              <Box key={item.id} sx={{ ml: 2, mt: 1 }}>
                <Typography variant="body2">{item.templateItemName}</Typography>

                {/* Status radio buttons with colored icons */}
                <RadioGroup
                  row
                  value={itemStates[item.id]?.status ?? "NO_APLICA"}
                  onChange={(e) =>
                    handleStatusChange(item.id, e.target.value as InspectionItemStatus)
                  }
                >
                  <FormControlLabel
                    value="OK"
                    control={<Radio sx={{ color: "success.main", "&.Mui-checked": { color: "success.main" } }} />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
                        <Typography variant="caption">OK</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="REVISAR"
                    control={<Radio sx={{ color: "warning.main", "&.Mui-checked": { color: "warning.main" } }} />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <WarningIcon sx={{ color: "warning.main", fontSize: 20 }} />
                        <Typography variant="caption">Revisar</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="PROBLEMA"
                    control={<Radio sx={{ color: "error.main", "&.Mui-checked": { color: "error.main" } }} />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <ErrorIcon sx={{ color: "error.main", fontSize: 20 }} />
                        <Typography variant="caption">Problema</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="NO_APLICA"
                    control={<Radio sx={{ color: "grey.500", "&.Mui-checked": { color: "grey.500" } }} />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <RemoveCircleOutlineIcon sx={{ color: "grey.500", fontSize: 20 }} />
                        <Typography variant="caption">N/A</Typography>
                      </Stack>
                    }
                  />
                </RadioGroup>

                {/* Optional comment */}
                <TextField
                  size="small"
                  placeholder="Comentario (opcional)"
                  value={itemStates[item.id]?.comment ?? ""}
                  onChange={(e) => handleCommentChange(item.id, e.target.value)}
                  fullWidth
                  sx={{ mt: 0.5 }}
                />
              </Box>
            ))}
          </Box>
        ))}
      </CardContent>
      <CardActions>
        <Button variant="contained" onClick={handleSave}>Guardar inspección</Button>
      </CardActions>
    </Card>
  );
}
```

**Status icons mapping**:

| Status | Color | Icon |
|---|---|---|
| `OK` | `success.main` (green) | `CheckCircleIcon` |
| `REVISAR` | `warning.main` (orange) | `WarningIcon` |
| `PROBLEMA` | `error.main` (red) | `ErrorIcon` |
| `NO_APLICA` | `grey.500` (grey) | `RemoveCircleOutlineIcon` |

#### `AddInspectionDialog` (Modal to select a template)

Location: `src/features/inspections/AddInspectionDialog.tsx`

```tsx
interface AddInspectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: number) => void;
}

export default function AddInspectionDialog({ open, onClose, onSelect }: AddInspectionDialogProps) {
  const { templates, loading } = useInspectionTemplates();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Inspección</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress />}
        {!loading && templates.length === 0 && (
          <Typography color="text.secondary">
            No hay plantillas de inspección disponibles. Cree una desde la configuración.
          </Typography>
        )}
        {!loading && templates.length > 0 && (
          <List>
            {templates.map((template) => (
              <ListItemButton key={template.id} onClick={() => onSelect(template.id)}>
                <ListItemText
                  primary={template.title}
                  secondary={`${template.groups.length} grupo(s)`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 5.5 Routes

Location: `src/routes/`

```typescript
// Config routes (under /configuracion)
{
  path: "/configuracion/plantillas-inspeccion",
  element: <InspectionTemplateListPage />,
}
{
  path: "/configuracion/plantillas-inspeccion/nueva",
  element: <InspectionTemplateBuilder />,      // create mode
}
{
  path: "/configuracion/plantillas-inspeccion/:id/editar",
  element: <InspectionTemplateBuilder />,      // edit mode
}
{
  path: "/configuracion/problemas-comunes",
  element: <CommonProblemsPage />,
}
```

All routes lazy loaded via `React.lazy(() => import(...))`.

> **Note**: The `InspectionsTab` component is **not** a routed page — it is rendered inside the repair order detail view's tab panel. It replaces the placeholder defined in spec `06-ordenes-reparacion.md`.

---

## 6. Business Rules

| # | Rule | Implementation |
|---|---|---|
| 1 | **Template must have ≥ 1 group** | Backend: `@NotEmpty` on `InspectionTemplateRequest.groups`. Frontend: disable save if no groups. |
| 2 | **Each group must have ≥ 1 item** | Backend: `@NotEmpty` on `InspectionTemplateGroupRequest.items`. Frontend: disable save if any group has no items. |
| 3 | **`sortOrder` management** | The frontend derives `sortOrder` from the array index (0-based) when sending the request. The backend stores the value as-is. Re-ordering on the UI updates the indices before saving. |
| 4 | **One status per inspection item** | DB CHECK constraint ensures only one of `OK`, `REVISAR`, `PROBLEMA`, `NO_APLICA`. The `InspectionItemStatus` enum enforces this. Radio buttons (MUI `RadioGroup`) inherently allow only one selection. |
| 5 | **Comment is optional** | `comment` column is nullable. Frontend sends `null` if the field is empty. |
| 6 | **Default status on creation** | When an inspection is created from a template, all items default to `NO_APLICA`. |
| 7 | **Deleting a template** | CASCADE deletes groups and items. Does **not** affect already-created inspections (inspections reference `template_id` but inspection items reference `template_item_id`; the FK on `inspection_items.template_item_id` does NOT cascade from template deletion — if a template is deleted, existing inspections keep their items but lose the link to the original template item). **Consider**: prevent deletion of templates that are in use, or show a warning. |
| 8 | **Duplicate template** | Creates a deep copy with title suffixed ` (Copia)`. All groups and items are duplicated with new IDs. |
| 9 | **Template updates do not affect existing inspections** | Once an inspection is created from a template, the inspection items are independent. If the template is later modified (items added/removed/reordered), existing inspections are not changed. |
| 10 | **Repair order `reason` and `mechanic_notes`** | These fields belong to the `repair_orders` table. The `InspectionsTab` provides editable `TextField`s for them. Saving calls the repair order update endpoint (from spec 06), not the inspection endpoints. |
| 11 | **Print inspection summary** | Button disabled if no inspections exist. Triggers `window.print()` as a basic implementation. A PDF generation enhancement can be added later. |
| 12 | **Common problems — simple lookup** | CRUD with no dependencies. Used as reference data that mechanics can consult. Not currently linked to inspection items programmatically (could be enhanced later). |

---

## 7. Testing

> **Note**: Tests are listed here for reference but will only be implemented after manual approval.

### 7.1 Backend — Unit Tests

| Test Class | What it covers |
|---|---|
| `InspectionTemplateServiceImplTest` | Unit tests with Mockito: create (happy path + empty groups validation), update (happy path + not found + reconcile groups/items), delete (happy path + not found), getAll, getById, duplicate (deep copy with new IDs and "(Copia)" suffix) |
| `CommonProblemServiceImplTest` | Unit tests with Mockito: create, update (happy path + not found), delete (happy path + not found), getAll, getById |
| `InspectionServiceImplTest` | Unit tests with Mockito: createForRepairOrder (happy path + repair order not found + template not found + items default to NO_APLICA), getByRepairOrder (happy path + repair order not found), saveItems (happy path + inspection not found + item not found), delete (happy path + not found), buildResponse groups correctly nested and sorted |
| `InspectionTemplateControllerTest` | `@WebMvcTest`: all 6 endpoints (getAll, getById, create, update, delete, duplicate). Validation errors (blank title, empty groups). Response codes (200, 201, 404). |
| `CommonProblemControllerTest` | `@WebMvcTest`: all 5 endpoints. Validation errors (blank description). Response codes. |
| `InspectionControllerTest` | `@WebMvcTest`: all 5 endpoints. Response codes (200, 201, 404). |
| `InspectionTemplateMapperTest` | Verifies `toResponse`, `toGroupResponse`, `toItemResponse` mappings |
| `CommonProblemMapperTest` | Verifies `toResponse`, `toEntity` mappings |
| `InspectionMapperTest` | Verifies `toResponse`, `toItemResponse` mappings (including nested field access) |

### 7.2 Backend — Integration Tests

| Test Class | What it covers |
|---|---|
| `InspectionTemplateRepositoryTest` | `@DataJpaTest` with Testcontainers: `findWithGroupsAndItemsById` loads full tree, `findAllByOrderByTitleAsc` ordering, cascade delete removes groups and items |
| `InspectionRepositoryTest` | `@DataJpaTest` with Testcontainers: `findByRepairOrderId` loads items with template info, `findWithItemsById` eager loading |
| `InspectionTemplateIntegrationTest` | `@SpringBootTest` + Testcontainers: full CRUD cycle (create → read → update with group/item reconciliation → duplicate → delete) via HTTP |
| `InspectionIntegrationTest` | `@SpringBootTest` + Testcontainers: create template → create repair order → create inspection → save items → verify statuses → delete inspection |

### 7.3 Frontend — Unit Tests

| Test File | What it covers |
|---|---|
| `InspectionTemplateBuilder.test.tsx` | Renders form, add/remove groups, add/remove items, reorder groups, save fires correct API call with sortOrder values |
| `InspectionTemplateListPage.test.tsx` | Renders list of templates, edit/duplicate/delete buttons fire callbacks |
| `CommonProblemsPage.test.tsx` | Renders list, create/edit dialog, delete confirmation |
| `InspectionsTab.test.tsx` | Renders reason/notes fields, add inspection button, print button disabled when no inspections, shows "No existen inspecciones" when empty |
| `InspectionForm.test.tsx` | Renders groups and items, radio buttons change status, comment field updates, save sends correct payload |
| `AddInspectionDialog.test.tsx` | Renders template list, shows empty message when no templates, clicking template fires onSelect |
| `useRepairOrderInspections.test.ts` | Hook fetches data, handles loading/error states, refetch works |
| `useInspectionTemplates.test.ts` | Hook fetches data, handles loading/error states |
