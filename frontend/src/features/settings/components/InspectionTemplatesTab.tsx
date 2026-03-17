import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router";

import { inspectionTemplatesApi } from "@/api/inspections";
import { useInspectionTemplates } from "@/features/inspections/useInspectionTemplates";

export function InspectionTemplatesTab() {
  const navigate = useNavigate();
  const { templates, loading, refetch } = useInspectionTemplates();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

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

  const handleDelete = async (id: number) => {
    try {
      await inspectionTemplatesApi.delete(id);
      showSnackbar("Plantilla eliminada", "success");
      refetch();
    } catch {
      showSnackbar("Error al eliminar la plantilla", "error");
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Fichas técnicas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/configuracion/plantillas-inspeccion/nueva")}
        >
          Nueva plantilla
        </Button>
      </Stack>

      {loading && <CircularProgress />}

      {templates.map((template) => (
        <Card key={template.id} sx={{ mb: 1 }}>
          <CardContent>
            <Typography variant="subtitle1">{template.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {template.groups.length} grupo(s)
            </Typography>
          </CardContent>
          <CardActions>
            <IconButton onClick={() => navigate(`/configuracion/plantillas-inspeccion/${template.id}/editar`)}>
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
