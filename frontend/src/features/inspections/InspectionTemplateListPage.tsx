import { useState } from "react";

import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router";

import { useInspectionTemplates } from "@/features/inspections/useInspectionTemplates";
import { inspectionTemplatesApi } from "@/api/inspections";

export default function InspectionTemplateListPage() {
  const navigate = useNavigate();
  const { templates, loading, error, refetch } = useInspectionTemplates();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDuplicate = async (id: number) => {
    try {
      await inspectionTemplatesApi.duplicate(id);
      showSnackbar("Plantilla duplicada", "success");
      refetch();
    } catch {
      showSnackbar("Error al duplicar la plantilla", "error");
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId === null) return;
    try {
      await inspectionTemplatesApi.delete(deletingId);
      showSnackbar("Plantilla eliminada", "success");
      refetch();
    } catch {
      showSnackbar("Error al eliminar la plantilla", "error");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Plantillas de inspeccion
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/configuracion/plantillas-inspeccion/nueva")}
        >
          Nueva Plantilla
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && templates.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          No hay plantillas de inspección. Cree una para comenzar.
        </Typography>
      )}

      {templates.map((template) => (
        <Card key={template.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{template.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {template.groups.length} grupo(s)
            </Typography>
          </CardContent>
          <CardActions>
            <IconButton
              onClick={() => navigate(`/configuracion/plantillas-inspeccion/${template.id}/editar`)}
              title="Editar"
            >
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDuplicate(template.id)} title="Duplicar">
              <ContentCopyIcon />
            </IconButton>
            <IconButton
              onClick={() => handleDeleteClick(template.id)}
              color="error"
              title="Eliminar"
            >
              <DeleteIcon />
            </IconButton>
          </CardActions>
        </Card>
      ))}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar plantilla</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar esta plantilla? Esta acción no se puede deshacer.
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
