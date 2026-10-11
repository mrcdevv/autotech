import { useState } from "react";

import {
  Button,
  Alert,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { AppSearchField } from "@/components/AppSearchField";
import { PageShell } from "@/components/PageShell";
import { PageToolbar } from "@/components/PageToolbar";
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
    <PageShell title="Vehículos">
      <PageToolbar
        filters={
          <>
            <AppSearchField
              placeholder="Buscar por patente..."
              value={searchPlate}
              onChange={(e) => {
                setSearchPlate(e.target.value);
                setPage(0);
              }}
            />
            <VehicleFilters
              brands={brands}
              onApplyFilter={applyFilter}
              onClearFilters={clearFilters}
            />
          </>
        }
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Nuevo vehículo
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
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

      <AppConfirmDialog
        open={deleteConfirm !== null}
        title="Eliminar vehículo"
        message="¿Está seguro que desea eliminar este vehículo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
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
    </PageShell>
  );
}
