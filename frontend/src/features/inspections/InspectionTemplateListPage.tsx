import { useState } from "react";

import {
  Box,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router";

import { PageShell } from "@/components/PageShell";
import { PageToolbar } from "@/components/PageToolbar";
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
    <PageShell title="Plantillas de inspección">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <PageToolbar
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/configuracion/plantillas-inspeccion/nueva")}
          >
            Nueva plantilla
          </Button>
        }
      />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && templates.length === 0 && (
        <Box sx={{ mt: 4, textAlign: "center", color: "text.secondary" }}>
          No hay plantillas de inspección. Cree una para comenzar.
        </Box>
      )}

      {templates.map((template) => (
        <Box
          key={template.id}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            mb: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
            transition: "all 0.2s",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ typography: "subtitle1", fontWeight: 500, mb: 0.5 }}>
              {template.title}
            </Box>
            <Box sx={{ typography: "body2", color: "text.secondary" }}>
              {template.groups.length} categoría{template.groups.length !== 1 ? "s" : ""}
            </Box>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <IconButton
              onClick={() => navigate(`/configuracion/plantillas-inspeccion/${template.id}/editar`)}
              title="Editar"
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => handleDuplicate(template.id)} title="Duplicar" size="small">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => handleDeleteClick(template.id)}
              color="error"
              title="Eliminar"
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
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
    </PageShell>
  );
}
