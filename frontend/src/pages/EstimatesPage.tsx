import { useState, useRef, useCallback } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router";

import { EstimateList } from "@/features/estimates/components/EstimateList";
import { useEstimates } from "@/features/estimates/hooks/useEstimates";

import type { SelectChangeEvent } from "@mui/material";
import type { EstimateStatus } from "@/types/estimate";

export default function EstimatesPage() {
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
  const handleInvoice = (id: number) => navigate(`/facturas/nuevo?estimateId=${id}`);

  const handleDeleteConfirm = async () => {
    if (deleteDialogId != null) {
      await deleteEstimate(deleteDialogId);
      setDeleteDialogId(null);
    }
  };

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Presupuestos
      </Typography>

      <Box display="flex" gap={2} mb={2.5} flexWrap="wrap" alignItems="center">
        <TextField
          placeholder="Buscar por nombre de cliente..."
          value={clientNameInput}
          onChange={(e) => handleClientNameChange(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
        />
        <TextField
          placeholder="Buscar por patente..."
          value={plateInput}
          onChange={(e) => handlePlateChange(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Crear nuevo presupuesto
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
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
        onDelete={(id) => setDeleteDialogId(id)}
        onInvoice={handleInvoice}
      />

      <Dialog open={deleteDialogId != null} onClose={() => setDeleteDialogId(null)}>
        <DialogTitle>Eliminar presupuesto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que querés eliminar este presupuesto? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogId(null)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
