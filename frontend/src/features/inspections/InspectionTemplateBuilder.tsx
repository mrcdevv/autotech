import { useState, useEffect } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Paper,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useNavigate, useParams } from "react-router";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { inspectionTemplatesApi } from "@/api/inspections";

import type {
  InspectionTemplateGroupRequest,
  InspectionTemplateItemRequest,
} from "@/features/inspections/types";

interface GroupState {
  id: number | null;
  tempId: string;
  title: string;
  items: ItemState[];
}

interface ItemState {
  id: number | null;
  tempId: string;
  name: string;
}

interface SortableItemProps {
  item: ItemState;
  groupIndex: number;
  itemIndex: number;
  totalItems: number;
  onUpdate: (name: string) => void;
  onRemove: () => void;
}

interface SortableGroupProps {
  group: GroupState;
  groupIndex: number;
  totalGroups: number;
  onUpdateTitle: (title: string) => void;
  onRemove: () => void;
  onAddItem: () => void;
  onUpdateItem: (itemIndex: number, name: string) => void;
  onRemoveItem: (itemIndex: number) => void;
  onReorderItems: (oldIndex: number, newIndex: number) => void;
}

function SortableItem({ item, onUpdate, onRemove, totalItems }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.tempId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 1,
        px: 2,
        borderRadius: 1,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "action.hover",
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          color: "text.secondary",
          "&:hover": { color: "primary.main" },
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
      <TextField
        value={item.name}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Nombre del elemento"
        size="small"
        sx={{ flex: 1 }}
        inputProps={{ maxLength: 255 }}
      />
      <IconButton size="small" onClick={onRemove} disabled={totalItems <= 1} color="error">
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

function SortableGroup({
  group,
  onUpdateTitle,
  onRemove,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onReorderItems,
}: SortableGroupProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.tempId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = group.items.findIndex((item) => item.tempId === active.id);
      const newIndex = group.items.findIndex((item) => item.tempId === over.id);
      onReorderItems(oldIndex, newIndex);
    }
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      <Box sx={{ bgcolor: "grey.50", px: 2, py: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: isDragging ? "grabbing" : "grab",
              display: "flex",
              alignItems: "center",
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            <DragIndicatorIcon />
          </Box>
          <TextField
            value={group.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Nombre de la categoría"
            size="small"
            sx={{ flex: 1 }}
            inputProps={{ maxLength: 255 }}
          />
          <IconButton onClick={onRemove} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={group.items.map((item) => item.tempId)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1}>
              {group.items.map((item, itemIndex) => (
                <SortableItem
                  key={item.tempId}
                  item={item}
                  groupIndex={0}
                  itemIndex={itemIndex}
                  totalItems={group.items.length}
                  onUpdate={(name) => onUpdateItem(itemIndex, name)}
                  onRemove={() => onRemoveItem(itemIndex)}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>

        <Button
          startIcon={<AddIcon />}
          onClick={onAddItem}
          variant="text"
          size="small"
          sx={{ mt: 2 }}
        >
          Agregar elemento
        </Button>
      </Box>
    </Paper>
  );
}

export default function InspectionTemplateBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [groups, setGroups] = useState<GroupState[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      inspectionTemplatesApi
        .getById(Number(id))
        .then((res) => {
          const template = res.data.data;
          setTitle(template.title);
          setGroups(
            template.groups.map((g) => ({
              id: g.id,
              tempId: `group-${g.id}-${Date.now()}`,
              title: g.title,
              items: g.items.map((i) => ({
                id: i.id,
                tempId: `item-${i.id}-${Date.now()}-${Math.random()}`,
                name: i.name,
              })),
            }))
          );
        })
        .catch(() => {
          setSnackbar({ open: true, message: "Error al cargar la plantilla", severity: "error" });
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const addGroup = () => {
    const newGroup: GroupState = {
      id: null,
      tempId: `group-new-${Date.now()}`,
      title: "",
      items: [{ id: null, tempId: `item-new-${Date.now()}`, name: "" }],
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  const removeGroup = (groupIndex: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== groupIndex));
  };

  const updateGroupTitle = (groupIndex: number, newTitle: string) => {
    setGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, title: newTitle } : g))
    );
  };

  const reorderGroups = (oldIndex: number, newIndex: number) => {
    setGroups((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const addItem = (groupIndex: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              items: [
                ...g.items,
                { id: null, tempId: `item-new-${Date.now()}-${Math.random()}`, name: "" },
              ],
            }
          : g
      )
    );
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, items: g.items.filter((_, j) => j !== itemIndex) } : g
      )
    );
  };

  const updateItemName = (groupIndex: number, itemIndex: number, newName: string) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? {
              ...g,
              items: g.items.map((item, ii) =>
                ii === itemIndex ? { ...item, name: newName } : item
              ),
            }
          : g
      )
    );
  };

  const reorderItems = (groupIndex: number, oldIndex: number, newIndex: number) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex ? { ...g, items: arrayMove(g.items, oldIndex, newIndex) } : g
      )
    );
  };

  const isValid = () => {
    if (!title.trim()) return false;
    if (groups.length === 0) return false;
    return groups.every(
      (g) => g.title.trim() && g.items.length > 0 && g.items.every((i) => i.name.trim())
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((group) => group.tempId === active.id);
      const newIndex = groups.findIndex((group) => group.tempId === over.id);
      reorderGroups(oldIndex, newIndex);
    }
  };

  const handleSave = async () => {
    if (!isValid()) return;

    const requestGroups: InspectionTemplateGroupRequest[] = groups.map((g, gi) => ({
      id: g.id,
      title: g.title.trim(),
      sortOrder: gi,
      items: g.items.map(
        (item, ii): InspectionTemplateItemRequest => ({
          id: item.id,
          name: item.name.trim(),
          sortOrder: ii,
        })
      ),
    }));

    const request = { title: title.trim(), groups: requestGroups };

    setSaving(true);
    try {
      if (isEditing) {
        await inspectionTemplatesApi.update(Number(id), request);
        setSnackbar({ open: true, message: "Plantilla actualizada", severity: "success" });
      } else {
        await inspectionTemplatesApi.create(request);
        setSnackbar({ open: true, message: "Plantilla creada", severity: "success" });
      }
      setTimeout(() => navigate("/configuracion/plantillas-inspeccion"), 500);
    } catch {
      setSnackbar({ open: true, message: "Error al guardar la plantilla", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 2.5, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h3" sx={{ mb: 3, fontWeight: 600 }}>
        {isEditing ? "Editar plantilla de inspección" : "Nueva plantilla de inspección"}
      </Typography>

      <TextField
        label="Título de la plantilla"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        sx={{ mb: 4 }}
        inputProps={{ maxLength: 255 }}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={groups.map((g) => g.tempId)} strategy={verticalListSortingStrategy}>
          <Stack spacing={2.5}>
            {groups.map((group, groupIndex) => (
              <SortableGroup
                key={group.tempId}
                group={group}
                groupIndex={groupIndex}
                totalGroups={groups.length}
                onUpdateTitle={(title) => updateGroupTitle(groupIndex, title)}
                onRemove={() => removeGroup(groupIndex)}
                onAddItem={() => addItem(groupIndex)}
                onUpdateItem={(itemIndex, name) => updateItemName(groupIndex, itemIndex, name)}
                onRemoveItem={(itemIndex) => removeItem(groupIndex, itemIndex)}
                onReorderItems={(oldIndex, newIndex) => reorderItems(groupIndex, oldIndex, newIndex)}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      <Tooltip title="Agrupa elementos de inspección relacionados (ej. Chapa, Luces, Motor)">
        <Button
          startIcon={<AddIcon />}
          onClick={addGroup}
          variant="contained"
          sx={{ mt: 3, mb: 4 }}
        >
          Agregar categoría
        </Button>
      </Tooltip>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => navigate("/configuracion/plantillas-inspeccion")}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!isValid() || saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
