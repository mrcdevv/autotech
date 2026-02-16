import { useState } from "react";

import { Box, Typography, Button, TextField, Alert, Snackbar } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { useCatalogServices } from "@/features/catalog/hooks/useCatalogServices";
import { ServicesDataGrid } from "@/features/catalog/components/ServicesDataGrid";
import { ServiceFormDialog } from "@/features/catalog/components/ServiceFormDialog";

import type { CatalogServiceResponse, CatalogServiceRequest } from "@/types/catalog";

export default function ServicesPage() {
  const {
    services,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    setQuery,
    createService,
    updateService,
    deleteService,
  } = useCatalogServices();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogServiceResponse | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    const service = services.find((s) => s.id === id);
    if (service) {
      setEditingService(service);
      setDialogOpen(true);
    }
  };

  const handleSave = async (data: CatalogServiceRequest) => {
    try {
      if (editingService) {
        await updateService(editingService.id, data);
        showSnackbar("Servicio actualizado", "success");
      } else {
        await createService(data);
        showSnackbar("Servicio creado", "success");
      }
      setDialogOpen(false);
    } catch {
      showSnackbar("Error al guardar el servicio", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteService(id);
      showSnackbar("Servicio eliminado", "success");
    } catch {
      showSnackbar("Error al eliminar el servicio", "error");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Servicios
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <TextField
          placeholder="Buscar por nombre o descripción..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 300 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Agregar servicio
        </Button>
      </Box>

      <ServicesDataGrid
        rows={services}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onEditRow={handleEdit}
        onDeleteRow={handleDelete}
      />

      <ServiceFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editingService}
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
