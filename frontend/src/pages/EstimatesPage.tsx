import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";

import {
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { AppSearchField } from "@/components/AppSearchField";
import { PageShell } from "@/components/PageShell";
import { PageToolbar } from "@/components/PageToolbar";
import { useAuth } from "@/features/auth/context/AuthContext";
import { EstimateList } from "@/features/estimates/components/EstimateList";
import { useEstimates } from "@/features/estimates/hooks/useEstimates";

import type { SelectChangeEvent } from "@mui/material";
import type { EstimateStatus } from "@/types/estimate";

export default function EstimatesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("create_estimate");
  const canDelete = hasPermission("delete_estimate");
  const canCreateDeliveryNote = hasPermission("create_delivery_note");
  const {
    estimates,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    setClientName,
    setPlate,
    setStatus,
    deleteEstimate,
  } = useEstimates();

  const navigate = useNavigate();
  const [clientNameInput, setClientNameInput] = useState("");
  const [plateInput, setPlateInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null);

  const clientNameTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const plateTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClientNameChange = useCallback((value: string) => {
    setClientNameInput(value);
    clearTimeout(clientNameTimer.current);
    clientNameTimer.current = setTimeout(() => {
      setClientName(value || undefined);
      setPage(0);
    }, 300);
  }, [setClientName, setPage]);

  const handlePlateChange = useCallback((value: string) => {
    setPlateInput(value);
    clearTimeout(plateTimer.current);
    plateTimer.current = setTimeout(() => {
      setPlate(value || undefined);
      setPage(0);
    }, 300);
  }, [setPlate, setPage]);

  const handleStatusChange = (e: SelectChangeEvent) => {
    const val = e.target.value;
    setStatusInput(val);
    setStatus(val ? (val as EstimateStatus) : undefined);
    setPage(0);
  };

  const handleRowClick = (id: number) => navigate(`/presupuestos/${id}`);
  const handleCreate = () => navigate("/presupuestos/nuevo");
  const handleDeliveryNote = (id: number) => navigate(`/remitos/nuevo?estimateId=${id}`);

  const handleDeleteConfirm = async () => {
    if (deleteDialogId != null) {
      await deleteEstimate(deleteDialogId);
      setDeleteDialogId(null);
    }
  };

  return (
    <PageShell title="Presupuestos">
      <PageToolbar
        filters={
          <>
            <AppSearchField
              placeholder="Buscar por nombre de cliente..."
              value={clientNameInput}
              onChange={(e) => handleClientNameChange(e.target.value)}
            />
            <AppSearchField
              placeholder="Buscar por patente..."
              value={plateInput}
              onChange={(e) => handlePlateChange(e.target.value)}
              sx={{ width: { xs: "100%", md: 240 }, minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={statusInput} onChange={handleStatusChange} label="Estado">
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="ACEPTADO">Aceptado</MenuItem>
                <MenuItem value="RECHAZADO">Rechazado</MenuItem>
              </Select>
            </FormControl>
          </>
        }
        actions={
          canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Crear nuevo presupuesto
            </Button>
          )
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <EstimateList
        rows={estimates}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRowClick={handleRowClick}
        onDelete={canDelete ? (id) => setDeleteDialogId(id) : undefined}
        onDeliveryNote={canCreateDeliveryNote ? handleDeliveryNote : undefined}
      />

      <AppConfirmDialog
        open={deleteDialogId != null}
        title="Eliminar presupuesto"
        message="¿Estás seguro de que querés eliminar este presupuesto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogId(null)}
      />
    </PageShell>
  );
}
