import { useState, useEffect } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useNavigate, useParams } from "react-router";

import { inspectionTemplatesApi } from "@/api/inspections";

import type {
  InspectionTemplateGroupRequest,
  InspectionTemplateItemRequest,
} from "@/features/inspections/types";

interface GroupState {
  id: number | null;
  title: string;
  items: ItemState[];
}

interface ItemState {
  id: number | null;
  name: string;
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
              title: g.title,
              items: g.items.map((i) => ({ id: i.id, name: i.name })),
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
    setGroups((prev) => [...prev, { id: null, title: "", items: [{ id: null, name: "" }] }]);
  };

  const removeGroup = (groupIndex: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== groupIndex));
  };

  const updateGroupTitle = (groupIndex: number, newTitle: string) => {
    setGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, title: newTitle } : g))
    );
  };

  const moveGroup = (groupIndex: number, direction: "up" | "down") => {
    setGroups((prev) => {
      const newGroups = [...prev];
      const targetIndex = direction === "up" ? groupIndex - 1 : groupIndex + 1;
      if (targetIndex < 0 || targetIndex >= newGroups.length) return prev;
      const temp = newGroups[groupIndex]!;
      newGroups[groupIndex] = newGroups[targetIndex]!;
      newGroups[targetIndex] = temp;
      return newGroups;
    });
  };

  const addItem = (groupIndex: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, items: [...g.items, { id: null, name: "" }] } : g
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

  const moveItem = (groupIndex: number, itemIndex: number, direction: "up" | "down") => {
    setGroups((prev) =>
      prev.map((g, gi) => {
        if (gi !== groupIndex) return g;
        const newItems = [...g.items];
        const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
        if (targetIndex < 0 || targetIndex >= newItems.length) return g;
        const temp = newItems[itemIndex]!;
        newItems[itemIndex] = newItems[targetIndex]!;
        newItems[targetIndex] = temp;
        return { ...g, items: newItems };
      })
    );
  };

  const isValid = () => {
    if (!title.trim()) return false;
    if (groups.length === 0) return false;
    return groups.every(
      (g) => g.title.trim() && g.items.length > 0 && g.items.every((i) => i.name.trim())
    );
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
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        {isEditing ? "Editar plantilla de inspeccion" : "Nueva plantilla de inspeccion"}
      </Typography>

      <TextField
        label="Título de la plantilla"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        inputProps={{ maxLength: 255 }}
      />

      {groups.map((group, groupIndex) => (
        <Card key={groupIndex} sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <IconButton
                size="small"
                onClick={() => moveGroup(groupIndex, "up")}
                disabled={groupIndex === 0}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => moveGroup(groupIndex, "down")}
                disabled={groupIndex === groups.length - 1}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
              <TextField
                label="Título del grupo"
                value={group.title}
                onChange={(e) => updateGroupTitle(groupIndex, e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                inputProps={{ maxLength: 255 }}
              />
              <IconButton onClick={() => removeGroup(groupIndex)} color="error">
                <DeleteIcon />
              </IconButton>
            </Stack>

            {group.items.map((item, itemIndex) => (
              <Stack
                key={itemIndex}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ ml: 4, mb: 1 }}
              >
                <IconButton
                  size="small"
                  onClick={() => moveItem(groupIndex, itemIndex, "up")}
                  disabled={itemIndex === 0}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => moveItem(groupIndex, itemIndex, "down")}
                  disabled={itemIndex === group.items.length - 1}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <TextField
                  label="Nombre del ítem"
                  value={item.name}
                  onChange={(e) => updateItemName(groupIndex, itemIndex, e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                  inputProps={{ maxLength: 255 }}
                />
                <IconButton
                  onClick={() => removeItem(groupIndex, itemIndex)}
                  color="error"
                  disabled={group.items.length <= 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={() => addItem(groupIndex)}
              size="small"
              sx={{ ml: 4, mt: 1 }}
            >
              Agregar ítem
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button startIcon={<AddIcon />} onClick={addGroup} sx={{ mb: 3 }}>
        Agregar grupo
      </Button>

      <Stack direction="row" spacing={2}>
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
