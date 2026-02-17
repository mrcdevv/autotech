import { useState } from "react";

import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useCommonProblems } from "@/features/inspections/useCommonProblems";
import { commonProblemsApi } from "@/api/inspections";

import type { CommonProblemResponse } from "@/features/inspections/types";

export default function CommonProblemsPage() {
  const { problems, loading, error, refetch } = useCommonProblems();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<CommonProblemResponse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const openCreateDialog = () => {
    setSelectedProblem(null);
    setDescription("");
    setDialogOpen(true);
  };

  const openEditDialog = (problem: CommonProblemResponse) => {
    setSelectedProblem(problem);
    setDescription(problem.description);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedProblem(null);
    setDescription("");
  };

  const handleSave = async () => {
    if (!description.trim()) return;
    try {
      if (selectedProblem) {
        await commonProblemsApi.update(selectedProblem.id, { description: description.trim() });
        showSnackbar("Problema común actualizado", "success");
      } else {
        await commonProblemsApi.create({ description: description.trim() });
        showSnackbar("Problema común creado", "success");
      }
      closeDialog();
      refetch();
    } catch {
      showSnackbar("Error al guardar el problema común", "error");
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId === null) return;
    try {
      await commonProblemsApi.delete(deletingId);
      showSnackbar("Problema común eliminado", "success");
      refetch();
    } catch {
      showSnackbar("Error al eliminar el problema común", "error");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Problemas comunes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Nuevo Problema
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && problems.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          No hay problemas comunes registrados.
        </Typography>
      )}

      <List>
        {problems.map((problem) => (
          <ListItem
            key={problem.id}
            secondaryAction={
              <>
                <IconButton onClick={() => openEditDialog(problem)} title="Editar">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteClick(problem.id)} color="error" title="Eliminar">
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText primary={problem.description} />
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedProblem ? "Editar Problema" : "Nuevo Problema"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!description.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar problema común</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar este problema común?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
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
