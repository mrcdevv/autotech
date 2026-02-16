import { useState } from "react";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { tagsApi } from "@/api/tags";
import { useTags } from "@/features/settings/hooks/useTags";

import type { TagResponse } from "@/types/appointment";
import type { TagRequest } from "@/api/tags";
import type { ApiResponse } from "@/types/api";

export function TagsManager() {
  const { tags, loading, refetch } = useTags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagResponse | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

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
    try {
      const request: TagRequest = { name, color: color || null };
      if (selectedTag) {
        await tagsApi.update(selectedTag.id, request);
        showSnackbar("Etiqueta actualizada", "success");
      } else {
        await tagsApi.create(request);
        showSnackbar("Etiqueta creada", "success");
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      const error = err as { response?: { data?: ApiResponse<unknown> } };
      const message = error.response?.data?.message ?? "Error al guardar la etiqueta";
      showSnackbar(message, "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tagsApi.delete(id);
      showSnackbar("Etiqueta eliminada", "success");
      refetch();
    } catch {
      showSnackbar("Error al eliminar la etiqueta", "error");
    }
  };

  return (
    <Box>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ mb: 2 }}>
        Nueva etiqueta
      </Button>

      {loading && <CircularProgress />}

      <List>
        {tags.map((tag) => (
          <ListItem
            key={tag.id}
            secondaryAction={
              <>
                <IconButton onClick={() => openEditDialog(tag)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(tag.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
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
              slotProps={{
                input: {
                  startAdornment: color ? (
                    <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: color, mr: 1, flexShrink: 0 }} />
                  ) : null,
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

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
