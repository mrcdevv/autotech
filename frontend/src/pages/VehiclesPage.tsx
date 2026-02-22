import { useState } from "react";

import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { useBrands } from "@/features/vehicles/hooks/useBrands";
import { useVehicleTypes } from "@/features/vehicles/hooks/useVehicleTypes";
import { VehicleList } from "@/features/vehicles/components/VehicleList";
import { VehicleForm } from "@/features/vehicles/components/VehicleForm";
import { VehicleFilters } from "@/features/vehicles/components/VehicleFilters";

import type { VehicleResponse, VehicleRequest } from "@/types/vehicle";

export default function VehiclesPage() {
  const {
    vehicles,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchPlate,
    setSearchPlate,
    applyFilter,
    clearFilters,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  } = useVehicles();

  const { brands, createBrand } = useBrands();
  const { vehicleTypes } = useVehicleTypes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingVehicle(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (vehicle) {
      setEditingVehicle(vehicle);
      setDialogOpen(true);
    }
  };

  const handleView = (id: number) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (vehicle) {
      setEditingVehicle(vehicle);
      setDialogOpen(true);
    }
  };

  const handleSave = async (data: VehicleRequest) => {
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, data);
        showSnackbar("Vehículo actualizado", "success");
      } else {
        await createVehicle(data);
        showSnackbar("Vehículo creado", "success");
      }
      setDialogOpen(false);
    } catch {
      showSnackbar("Error al guardar el vehículo", "error");
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm === null) return;
    try {
      await deleteVehicle(deleteConfirm);
      showSnackbar("Vehículo eliminado", "success");
    } catch {
      showSnackbar("Error al eliminar el vehículo", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
          Vehículos
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <TextField
            placeholder="Buscar por patente..."
            value={searchPlate}
            onChange={(e) => {
              setSearchPlate(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{
              minWidth: 260,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: "#fff",
                "& fieldset": { borderColor: "#e2e8f0" },
                "&:hover fieldset": { borderColor: "#cbd5e1" },
              },
              "& .MuiInputBase-input": {
                padding: "8px 14px",
                fontSize: "0.875rem",
              },
            }}
          />
          <VehicleFilters
            brands={brands}
            onApplyFilter={applyFilter}
            onClearFilters={clearFilters}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              backgroundColor: "#0ea5e9", // A nice soft blue similar to the image
              "&:hover": {
                backgroundColor: "#0284c7",
                boxShadow: "none",
              },
            }}
          >
            Nuevo vehículo
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
          {error}
        </Alert>
      )}

      <VehicleList
        rows={vehicles}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onEditRow={handleEdit}
        onDeleteRow={handleDeleteRequest}
        onViewRow={handleView}
      />

      <VehicleForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onCreateBrand={createBrand}
        initialData={editingVehicle}
        brands={brands}
        vehicleTypes={vehicleTypes}
      />

      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar este vehículo? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
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
