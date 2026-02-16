import { useState } from "react";

import { Box, Typography, Button, TextField, Alert, Snackbar } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { useCannedJobs } from "@/features/catalog/hooks/useCannedJobs";
import { CannedJobsDataGrid } from "@/features/catalog/components/CannedJobsDataGrid";
import { CannedJobFormDialog } from "@/features/catalog/components/CannedJobFormDialog";

import type { CannedJobDetailResponse, CannedJobRequest } from "@/types/catalog";

export default function CannedJobsPage() {
  const {
    cannedJobs,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    setQuery,
    getCannedJobById,
    createCannedJob,
    updateCannedJob,
    deleteCannedJob,
  } = useCannedJobs();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CannedJobDetailResponse | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingJob(null);
    setDialogOpen(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const detail = await getCannedJobById(id);
      setEditingJob(detail);
      setDialogOpen(true);
    } catch {
      showSnackbar("Error al cargar el trabajo enlatado", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCannedJob(id);
      showSnackbar("Trabajo enlatado eliminado", "success");
    } catch {
      showSnackbar("Error al eliminar el trabajo enlatado", "error");
    }
  };

  const handleSave = async (data: CannedJobRequest) => {
    try {
      if (editingJob) {
        await updateCannedJob(editingJob.id, data);
        showSnackbar("Trabajo enlatado actualizado", "success");
      } else {
        await createCannedJob(data);
        showSnackbar("Trabajo enlatado creado", "success");
      }
      setDialogOpen(false);
    } catch {
      showSnackbar("Error al guardar el trabajo enlatado", "error");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Trabajos enlatados
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <TextField
          placeholder="Buscar por título o descripción..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 300 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Agregar trabajo enlatado
        </Button>
      </Box>

      <CannedJobsDataGrid
        rows={cannedJobs}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onEditRow={handleEdit}
        onDeleteRow={handleDelete}
      />

      <CannedJobFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editingJob}
      />

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
