# 11 — Configuración

## 1. Overview

This feature implements the **Configuration** screen — a centralized settings page with multiple tabs for managing workshop-wide settings. The page aggregates configuration UIs for several subsystems that already have backend APIs defined in other specs (bank accounts from spec 10, inspection templates from spec 07, calendar config from spec 05). Additionally, it introduces **Tags CRUD** management (shared between calendar and repair order features).

The Configuration page has **4 tabs**:

1. **Pagos / Cuentas bancarias** — CRUD for bank accounts (bank dropdown from `banks` table, alias, CBU/CVU). The API endpoints exist in spec 10; this spec covers the **config screen UI only**.
2. **Fichas técnicas** — List inspection templates with actions (edit, duplicate, delete). Links to the template builder page (spec 07). This spec covers the **config screen entry point UI**.
3. **Calendario** — Edit default appointment duration (minutes), manage tags (CRUD for `tags` table).
4. **Órdenes de trabajo** — Manage tags (same `tags` table, shared across the system).

> **Note**: Tags are shared between Calendar and Repair Orders. The same `tags` table and API endpoints serve both tabs. Each tab provides a convenient entry point to manage tags from its relevant context.

---

## 2. Git

| Item | Value |
|---|---|
| Branch | `feature/configuracion` |
| Base | `develop` |
| Commit style | Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) |

Example commits:
- `feat: add Tag entity, repository, and CRUD endpoints`
- `feat: add SettingsPage with tab navigation`
- `feat: add BankAccountsTab with CRUD dialog`
- `feat: add InspectionTemplatesTab linking to template builder`
- `feat: add CalendarSettingsTab with duration and tags management`
- `feat: add RepairOrderSettingsTab with tags management`
- `test: add unit tests for TagService`

---

## 3. DB Tables

The feature relies on the following tables from `V1__init_schema.sql`. **No new migration needed.**

### 3.1 `tags`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE |
| `color` | `VARCHAR(7)` | nullable (hex color, e.g. `#FF5733`) |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.2 `banks` (read-only, seeded)

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

Seeded values: Mercadopago, Banco de Cordoba, BBVA Frances, Banco Galicia, Banco Santander, Banco Nacion, Banco Provincia, HSBC, Banco Macro, Brubank, Uala.

### 3.3 `bank_accounts`

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `bank_id` | `BIGINT` | NOT NULL, FK → `banks(id)` |
| `alias` | `VARCHAR(100)` | NOT NULL |
| `cbu_cvu` | `VARCHAR(30)` | nullable |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.4 `calendar_config` (referenced, already managed by spec 05)

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `default_appointment_duration_minutes` | `INTEGER` | NOT NULL DEFAULT 60 |
| `start_time` | `TIME` | nullable |
| `end_time` | `TIME` | nullable |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

### 3.5 `inspection_templates` (referenced, read-only from this spec)

| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `title` | `VARCHAR(255)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() |

---

## 4. Backend

### 4.1 Package Structure

The Tag entity and its CRUD are new. Bank accounts, calendar config, and inspection templates already have APIs from other specs.

```
com.autotech.tag/
├── controller/
│   └── TagController.java
├── service/
│   ├── TagService.java                  (interface)
│   └── TagServiceImpl.java             (implementation)
├── repository/
│   └── TagRepository.java
├── model/
│   └── Tag.java
└── dto/
    ├── TagRequest.java
    ├── TagResponse.java
    └── TagMapper.java
```

> **Note**: `BankAccount`, `Bank`, `CalendarConfig`, and `InspectionTemplate` entities, repositories, services, and controllers are defined in their respective specs (10, 05, 07). This spec only adds the **Tag** backend and the **frontend settings page**.

### 4.2 Entity — `Tag`

Location: `com.autotech.tag.model.Tag`

```java
@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Tag extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "color", length = 7)
    private String color;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Tag other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

### 4.3 Repository — `TagRepository`

Location: `com.autotech.tag.repository.TagRepository`

```java
@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    List<Tag> findAllByOrderByNameAsc();
}
```

### 4.4 DTOs

Location: `com.autotech.tag.dto`

#### `TagRequest`

```java
public record TagRequest(

    @NotBlank(message = "El nombre de la etiqueta es obligatorio")
    @Size(max = 100, message = "El nombre no debe superar los 100 caracteres")
    String name,

    @Size(max = 7, message = "El color no debe superar los 7 caracteres")
    String color
) {}
```

#### `TagResponse`

```java
public record TagResponse(
    Long id,
    String name,
    String color,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

### 4.5 Mapper — `TagMapper`

Location: `com.autotech.tag.dto.TagMapper`

```java
@Mapper(componentModel = "spring")
public interface TagMapper {

    TagResponse toResponse(Tag entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Tag toEntity(TagRequest request);

    List<TagResponse> toResponseList(List<Tag> entities);
}
```

### 4.6 Service — `TagService`

```java
public interface TagService {

    List<TagResponse> getAll();

    TagResponse getById(Long id);

    TagResponse create(TagRequest request);

    TagResponse update(Long id, TagRequest request);

    void delete(Long id);
}
```

#### `TagServiceImpl`

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getAll() {
        return tagMapper.toResponseList(tagRepository.findAllByOrderByNameAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public TagResponse getById(Long id) {
        Tag tag = tagRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No se encontró la etiqueta con ID " + id));
        return tagMapper.toResponse(tag);
    }

    @Override
    @Transactional
    public TagResponse create(TagRequest request) {
        if (tagRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Ya existe una etiqueta con el nombre '" + request.name() + "'");
        }
        Tag entity = tagMapper.toEntity(request);
        return tagMapper.toResponse(tagRepository.save(entity));
    }

    @Override
    @Transactional
    public TagResponse update(Long id, TagRequest request) {
        Tag existing = tagRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No se encontró la etiqueta con ID " + id));
        if (tagRepository.existsByNameAndIdNot(request.name(), id)) {
            throw new DuplicateResourceException("Ya existe una etiqueta con el nombre '" + request.name() + "'");
        }
        existing.setName(request.name());
        existing.setColor(request.color());
        return tagMapper.toResponse(tagRepository.save(existing));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Tag existing = tagRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No se encontró la etiqueta con ID " + id));
        tagRepository.delete(existing);
    }
}
```

### 4.7 Controller — `TagController`

Location: `com.autotech.tag.controller.TagController`

Base path: `/api/tags`

```java
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(tagService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tagService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> create(@Valid @RequestBody TagRequest request) {
        TagResponse created = tagService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Etiqueta creada", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TagRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Etiqueta actualizada", tagService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        tagService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Etiqueta eliminada", null));
    }
}
```

#### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tags` | List all tags (ordered by name) |
| `GET` | `/api/tags/{id}` | Get tag by ID |
| `POST` | `/api/tags` | Create new tag |
| `PUT` | `/api/tags/{id}` | Update tag |
| `DELETE` | `/api/tags/{id}` | Delete tag |

> **Existing endpoints used by this feature** (from other specs):
>
> | Method | Path | Spec | Description |
> |---|---|---|---|
> | `GET` | `/api/bank-accounts` | 10 | List all bank accounts |
> | `POST` | `/api/bank-accounts` | 10 | Create bank account |
> | `PUT` | `/api/bank-accounts/{id}` | 10 | Update bank account |
> | `DELETE` | `/api/bank-accounts/{id}` | 10 | Delete bank account |
> | `GET` | `/api/banks` | 10 | List all banks (dropdown) |
> | `GET` | `/api/calendar-config` | 05 | Get calendar config |
> | `PUT` | `/api/calendar-config` | 05 | Update calendar config |
> | `GET` | `/api/inspection-templates` | 07 | List all inspection templates |
> | `POST` | `/api/inspection-templates/{id}/duplicate` | 07 | Duplicate template |
> | `DELETE` | `/api/inspection-templates/{id}` | 07 | Delete template |

---

## 5. Frontend

### 5.1 Folder Structure

```
src/
├── api/
│   └── tags.ts
├── features/
│   └── settings/
│       ├── components/
│       │   ├── BankAccountsTab.tsx
│       │   ├── BankAccountFormDialog.tsx
│       │   ├── InspectionTemplatesTab.tsx
│       │   ├── CalendarSettingsTab.tsx
│       │   ├── RepairOrderSettingsTab.tsx
│       │   └── TagsManager.tsx
│       └── hooks/
│           └── useTags.ts
├── pages/
│   └── SettingsPage.tsx
└── types/
    └── tag.ts
```

### 5.2 Types

Location: `src/features/settings/types.ts`

```typescript
// Tag types
interface TagResponse {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TagRequest {
  name: string;
  color: string | null;
}

// Bank account types (already defined in spec 10, re-exported here for reference)
interface BankResponse {
  id: number;
  name: string;
}

interface BankAccountResponse {
  id: number;
  bankId: number;
  bankName: string;
  alias: string;
  cbuCvu: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BankAccountRequest {
  bankId: number;
  alias: string;
  cbuCvu: string | null;
}
```

### 5.3 API

Location: `src/api/tags.ts`

```typescript
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { TagResponse, TagRequest } from "@/features/settings/types";

export const tagsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<TagResponse[]>>("/tags"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<TagResponse>>(`/tags/${id}`),

  create: (data: TagRequest) =>
    apiClient.post<ApiResponse<TagResponse>>("/tags", data),

  update: (id: number, data: TagRequest) =>
    apiClient.put<ApiResponse<TagResponse>>(`/tags/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/tags/${id}`),
};
```

### 5.4 Hooks

Location: `src/features/settings/hooks/`

#### `useTags.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { tagsApi } from "@/api/tags";
import type { TagResponse } from "@/features/settings/types";

export function useTags() {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tagsApi.getAll();
      setTags(res.data.data);
    } catch {
      setError("Error al cargar etiquetas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  return { tags, loading, error, refetch: fetchTags };
}
```

### 5.5 Pages

#### `SettingsPage`

Location: `src/pages/SettingsPage.tsx`

Route: `/configuracion`

```tsx
import { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { BankAccountsTab } from "@/features/settings/components/BankAccountsTab";
import { InspectionTemplatesTab } from "@/features/settings/components/InspectionTemplatesTab";
import { CalendarSettingsTab } from "@/features/settings/components/CalendarSettingsTab";
import { RepairOrderSettingsTab } from "@/features/settings/components/RepairOrderSettingsTab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4">Configuración</Typography>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mt: 2, mb: 3 }}>
        <Tab label="Pagos / Cuentas bancarias" />
        <Tab label="Fichas técnicas" />
        <Tab label="Calendario" />
        <Tab label="Órdenes de trabajo" />
      </Tabs>

      {activeTab === 0 && <BankAccountsTab />}
      {activeTab === 1 && <InspectionTemplatesTab />}
      {activeTab === 2 && <CalendarSettingsTab />}
      {activeTab === 3 && <RepairOrderSettingsTab />}
    </Box>
  );
}
```

### 5.6 Components

#### `BankAccountsTab`

Location: `src/features/settings/components/BankAccountsTab.tsx`

Displays existing bank accounts in a list/table and provides a button to create new ones via a dialog.

```tsx
export function BankAccountsTab() {
  // Uses bankAccountsApi (from spec 10) and banksApi
  // State: accounts list, dialogOpen, selectedAccount

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Cuentas bancarias</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Nueva cuenta bancaria
        </Button>
      </Stack>

      {/* Accounts list */}
      <List>
        {accounts.map((account) => (
          <ListItem key={account.id}
            secondaryAction={
              <>
                <IconButton onClick={() => openEditDialog(account)}><EditIcon /></IconButton>
                <IconButton onClick={() => handleDelete(account.id)} color="error"><DeleteIcon /></IconButton>
              </>
            }>
            <ListItemText
              primary={account.alias}
              secondary={`${account.bankName}${account.cbuCvu ? ` — ${account.cbuCvu}` : ""}`}
            />
          </ListItem>
        ))}
      </List>

      <BankAccountFormDialog
        open={dialogOpen}
        account={selectedAccount}
        onClose={closeDialog}
        onSave={handleSave}
      />
    </Box>
  );
}
```

#### `BankAccountFormDialog`

Location: `src/features/settings/components/BankAccountFormDialog.tsx`

```tsx
interface BankAccountFormDialogProps {
  open: boolean;
  account: BankAccountResponse | null;
  onClose: () => void;
  onSave: () => void;
}

export function BankAccountFormDialog({ open, account, onClose, onSave }: BankAccountFormDialogProps) {
  // State: bankId, alias, cbuCvu
  // Fetches banks list from /api/banks for the dropdown

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{account ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            options={banks}
            getOptionLabel={(b) => b.name}
            value={selectedBank}
            onChange={(_, v) => setBankId(v?.id ?? null)}
            renderInput={(params) => <TextField {...params} label="Banco" required />}
          />
          <TextField label="Alias o nombre de la cuenta" value={alias} onChange={...} required />
          <TextField label="CBU o CVU" value={cbuCvu} onChange={...} helperText="Opcional" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
```

#### `InspectionTemplatesTab`

Location: `src/features/settings/components/InspectionTemplatesTab.tsx`

Displays inspection templates as a list of cards. Actions: edit (navigates to template builder page), duplicate, delete. "Nueva Plantilla" button navigates to the template builder.

```tsx
export function InspectionTemplatesTab() {
  // Uses inspectionTemplatesApi (from spec 07)
  const { templates, loading, refetch } = useInspectionTemplates();

  const handleDuplicate = async (id: number) => {
    await inspectionTemplatesApi.duplicate(id);
    refetch();
  };

  const handleDelete = async (id: number) => {
    await inspectionTemplatesApi.delete(id);
    refetch();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Fichas técnicas</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => navigate("/configuracion/plantillas-inspeccion/nueva")}>
          Nueva plantilla
        </Button>
      </Stack>

      {templates.map((template) => (
        <Card key={template.id} sx={{ mb: 1 }}>
          <CardContent>
            <Typography variant="subtitle1">{template.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {template.groups.length} grupo(s)
            </Typography>
          </CardContent>
          <CardActions>
            <IconButton onClick={() => navigate(`/configuracion/plantillas-inspeccion/${template.id}`)}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDuplicate(template.id)}>
              <ContentCopyIcon />
            </IconButton>
            <IconButton onClick={() => handleDelete(template.id)} color="error">
              <DeleteIcon />
            </IconButton>
          </CardActions>
        </Card>
      ))}

      {!loading && templates.length === 0 && (
        <Typography color="text.secondary">No hay plantillas de inspección creadas</Typography>
      )}
    </Box>
  );
}
```

#### `CalendarSettingsTab`

Location: `src/features/settings/components/CalendarSettingsTab.tsx`

Manages calendar config (default appointment duration) and tags.

```tsx
export function CalendarSettingsTab() {
  const { config, updateConfig } = useCalendarConfig();
  const [duration, setDuration] = useState<number>(60);

  useEffect(() => {
    if (config) setDuration(config.defaultAppointmentDurationMinutes);
  }, [config]);

  const handleSaveDuration = async () => {
    await updateConfig({
      defaultAppointmentDurationMinutes: duration,
      startTime: config?.startTime ?? null,
      endTime: config?.endTime ?? null,
    });
  };

  return (
    <Box>
      {/* Duration config */}
      <Typography variant="h6" sx={{ mb: 2 }}>Duración de citas por defecto</Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <TextField
          label="Duración (minutos)"
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          inputProps={{ min: 1 }}
          sx={{ width: 200 }}
        />
        <Button variant="contained" onClick={handleSaveDuration}>Guardar</Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Tags management */}
      <Typography variant="h6" sx={{ mb: 2 }}>Etiquetas</Typography>
      <TagsManager />
    </Box>
  );
}
```

#### `RepairOrderSettingsTab`

Location: `src/features/settings/components/RepairOrderSettingsTab.tsx`

Manages tags (same shared component).

```tsx
export function RepairOrderSettingsTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Etiquetas</Typography>
      <TagsManager />
    </Box>
  );
}
```

#### `TagsManager` (Shared reusable component)

Location: `src/features/settings/components/TagsManager.tsx`

Provides full CRUD for tags with inline dialog for create/edit.

```tsx
export function TagsManager() {
  const { tags, loading, refetch } = useTags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagResponse | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");

  const openCreateDialog = () => {
    setSelectedTag(null);
    setName("");
    setColor("");
    setDialogOpen(true);
  };

  const openEditDialog = (tag: TagResponse) => {
    setSelectedTag(tag);
    setName(tag.name);
    setColor(tag.color ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const request = { name, color: color || null };
    if (selectedTag) {
      await tagsApi.update(selectedTag.id, request);
    } else {
      await tagsApi.create(request);
    }
    setDialogOpen(false);
    refetch();
  };

  const handleDelete = async (id: number) => {
    await tagsApi.delete(id);
    refetch();
  };

  return (
    <Box>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ mb: 2 }}>
        Nueva etiqueta
      </Button>

      {loading && <CircularProgress />}

      <List>
        {tags.map((tag) => (
          <ListItem key={tag.id}
            secondaryAction={
              <>
                <IconButton onClick={() => openEditDialog(tag)}><EditIcon /></IconButton>
                <IconButton onClick={() => handleDelete(tag.id)} color="error"><DeleteIcon /></IconButton>
              </>
            }>
            <ListItemIcon>
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: tag.color ?? "grey.400" }} />
            </ListItemIcon>
            <ListItemText primary={tag.name} />
          </ListItem>
        ))}
      </List>

      {!loading && tags.length === 0 && (
        <Typography color="text.secondary">No hay etiquetas creadas</Typography>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{selectedTag ? "Editar etiqueta" : "Nueva etiqueta"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField
              label="Color (hex)"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#FF5733"
              fullWidth
              InputProps={{
                startAdornment: color ? (
                  <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: color, mr: 1 }} />
                ) : null,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

### 5.7 Routes

Location: `src/routes/`

```typescript
{ path: "/configuracion", element: <SettingsPage /> }
```

Lazy loaded via `React.lazy`:

```typescript
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
```

> **Note**: The inspection template builder routes (`/configuracion/plantillas-inspeccion/nueva` and `/configuracion/plantillas-inspeccion/:id`) are defined in spec 07.

---

## 6. Business Rules

| # | Rule | Implementation |
|---|---|---|
| 1 | **Tag name must be unique** | Backend: `existsByName()` on create, `existsByNameAndIdNot()` on update. Throw `DuplicateResourceException` (HTTP 409) with message "Ya existe una etiqueta con el nombre '{name}'". |
| 2 | **Tag color is optional** | Backend: `color` is nullable. Frontend: color field is optional with a hex color placeholder. |
| 3 | **Tags are shared** | The same `tags` table and `/api/tags` endpoints are used by Calendar (spec 05) and Repair Orders (spec 06). Both the Calendar and Repair Order settings tabs show the same tags list via the `TagsManager` component. |
| 4 | **Deleting a tag cascades** | DB: `appointment_tags` and `repair_order_tags` have `ON DELETE CASCADE`. Deleting a tag automatically removes its associations from appointments and repair orders. |
| 5 | **Bank account requires a bank** | Frontend: bank dropdown is required. Backend: `bankId` is `NOT NULL` in `bank_accounts`. Banks are seeded and read-only — users select from the existing list. |
| 6 | **CBU/CVU is optional** | The `cbu_cvu` field on `bank_accounts` is nullable. The form shows it as optional with helper text. |
| 7 | **Calendar duration minimum** | Backend: `@Min(1)` on `CalendarConfigRequest.defaultAppointmentDurationMinutes`. Frontend: `min: 1` on the input. |
| 8 | **Inspection templates are read-only links** | This spec does not modify inspection template data directly. It lists templates and provides navigation to the template builder (spec 07). Duplicate and delete actions call the existing spec 07 API endpoints. |
| 9 | **Settings require manage_config permission** | The `/configuracion` route and its API calls are restricted to users with the `manage_config` permission (enforced when authentication is implemented in spec 13). |

---

## 7. Testing

### 7.1 Backend — Unit Tests

| Test Class | What it covers |
|---|---|
| `TagServiceImplTest` | Unit tests with Mockito: `getAll` returns ordered list, `getById` happy path + not found, `create` happy path + duplicate name, `update` happy path + not found + duplicate name, `delete` happy path + not found |
| `TagControllerTest` | `@WebMvcTest` with mocked service: all endpoints return correct status codes, validation errors (blank name, name too long), 409 on duplicate |
| `TagMapperTest` | Verifies `toResponse`, `toEntity`, and `toResponseList` mappings |

### 7.2 Backend — Integration Tests

| Test Class | What it covers |
|---|---|
| `TagRepositoryTest` | `@DataJpaTest`: `existsByName`, `existsByNameAndIdNot`, `findAllByOrderByNameAsc` |
| `TagIntegrationTest` | `@SpringBootTest` + Testcontainers: full create → read → update → delete flow via HTTP |

### 7.3 Frontend — Unit Tests

| Test File | What it covers |
|---|---|
| `SettingsPage.test.tsx` | Renders 4 tabs, switching tabs shows correct content |
| `BankAccountsTab.test.tsx` | Renders accounts list, create dialog opens, edit dialog populates fields, delete removes from list |
| `BankAccountFormDialog.test.tsx` | Renders form fields, bank dropdown loads options, validates required fields, submits correct payload |
| `InspectionTemplatesTab.test.tsx` | Renders template cards, navigate to builder on edit/create click, duplicate calls API, delete calls API |
| `CalendarSettingsTab.test.tsx` | Renders duration input with current config value, save button calls updateConfig, TagsManager renders below |
| `RepairOrderSettingsTab.test.tsx` | Renders TagsManager component |
| `TagsManager.test.tsx` | Renders tags list with color dots, create dialog opens, edit dialog populates, delete removes tag, empty state message when no tags |
| `useTags.test.ts` | Hook fetches data on mount, handles loading/error states, refetch works |

---

## 8. Implementation Checklist

> **Instructions for AI agents**: Check off each item as you complete it. Do not remove items. If an item is not applicable, mark it with `[x]` and add "(N/A)" next to it.

### 8.1 Backend

- [ ] Create `Tag` entity (`com.autotech.tag.model.Tag`) with `name` (unique, max 100) and `color` (nullable, max 7) fields extending `BaseEntity`
- [ ] Create `TagRepository` (`com.autotech.tag.repository.TagRepository`) with `existsByName()`, `existsByNameAndIdNot()`, and `findAllByOrderByNameAsc()` methods
- [ ] Create `TagRequest` DTO with Jakarta Validation annotations (`@NotBlank`, `@Size`)
- [ ] Create `TagResponse` DTO (record with `id`, `name`, `color`, `createdAt`, `updatedAt`)
- [ ] Create `TagMapper` as a manual `@Component` class (NOT MapStruct — see AGENTS.md) with `toResponse()`, `toEntity()`, and `toResponseList()` methods
- [ ] Create `TagService` interface with `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- [ ] Create `TagServiceImpl` implementation:
  - [ ] `getAll()` — returns all tags ordered by name
  - [ ] `getById()` — returns tag or throws `ResourceNotFoundException`
  - [ ] `create()` — validates unique name, maps and saves
  - [ ] `update()` — validates exists, validates unique name (excluding self), updates fields
  - [ ] `delete()` — validates exists, deletes
- [ ] Create `TagController` with all endpoints:
  - [ ] `GET /api/tags` — list all tags
  - [ ] `GET /api/tags/{id}` — get tag by ID
  - [ ] `POST /api/tags` — create tag
  - [ ] `PUT /api/tags/{id}` — update tag
  - [ ] `DELETE /api/tags/{id}` — delete tag
- [ ] Verify backend compiles: `./mvnw clean compile`
- [ ] Verify backend starts: `./mvnw clean spring-boot:run`

### 8.2 Frontend

- [ ] Create types file (`src/features/settings/types.ts`) with `TagResponse`, `TagRequest`, `BankResponse`, `BankAccountResponse`, `BankAccountRequest`
- [ ] Create API layer (`src/api/tags.ts`) with `getAll`, `getById`, `create`, `update`, `delete`
- [ ] Create `useTags` hook (`src/features/settings/hooks/useTags.ts`)
- [ ] Create `SettingsPage` (`src/pages/SettingsPage.tsx`) with 4-tab navigation
- [ ] Create `BankAccountsTab` component — list bank accounts with create/edit/delete actions
- [ ] Create `BankAccountFormDialog` component — form dialog with bank dropdown (Autocomplete), alias, CBU/CVU fields
- [ ] Create `InspectionTemplatesTab` component — list templates with edit (navigate), duplicate, delete actions
- [ ] Create `CalendarSettingsTab` component — duration input with save, plus `TagsManager`
- [ ] Create `RepairOrderSettingsTab` component — renders `TagsManager`
- [ ] Create `TagsManager` shared component — full CRUD for tags with inline create/edit dialog, color dot display
- [ ] Register route `/configuracion` with lazy loading
- [ ] Verify frontend compiles
- [ ] Verify frontend runs

### 8.3 Business Rules Verification

- [ ] Tag name must be unique — `DuplicateResourceException` (HTTP 409) on create and update
- [ ] Tag color is optional — nullable in backend, optional in frontend form
- [ ] Tags are shared — same `tags` table and `/api/tags` endpoints used by Calendar and Repair Order tabs via `TagsManager`
- [ ] Deleting a tag cascades — `ON DELETE CASCADE` on `appointment_tags` and `repair_order_tags`
- [ ] Bank account requires a bank — bank dropdown is required, `bankId` is NOT NULL
- [ ] CBU/CVU is optional — nullable field with helper text in form
- [ ] Calendar duration minimum — `@Min(1)` on backend, `min: 1` on frontend input
- [ ] Inspection templates are read-only links — list, navigate to builder, duplicate, delete only
- [ ] Settings require `manage_config` permission (enforced when spec 13 is implemented)

### 8.4 Testing

- [ ] `TagServiceImplTest` — unit tests with Mockito for all CRUD operations and error cases
- [ ] `TagControllerTest` — `@WebMvcTest` for all endpoints, validation errors, 409 on duplicate
- [ ] `TagMapperTest` — verify `toResponse`, `toEntity`, `toResponseList` mappings
- [ ] `TagRepositoryTest` — `@DataJpaTest` for `existsByName`, `existsByNameAndIdNot`, `findAllByOrderByNameAsc`
- [ ] `TagIntegrationTest` — `@SpringBootTest` + Testcontainers full CRUD flow via HTTP
- [ ] `SettingsPage.test.tsx` — renders 4 tabs, switching shows correct content
- [ ] `BankAccountsTab.test.tsx` — renders list, create/edit/delete dialogs
- [ ] `BankAccountFormDialog.test.tsx` — renders form, bank dropdown, validates required fields
- [ ] `InspectionTemplatesTab.test.tsx` — renders cards, navigate/duplicate/delete actions
- [ ] `CalendarSettingsTab.test.tsx` — renders duration input, save button, TagsManager
- [ ] `RepairOrderSettingsTab.test.tsx` — renders TagsManager
- [ ] `TagsManager.test.tsx` — renders list, create/edit/delete, empty state
- [ ] `useTags.test.ts` — hook fetch, loading/error states, refetch
