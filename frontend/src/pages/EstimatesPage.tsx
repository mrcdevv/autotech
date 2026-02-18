import { useState } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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

  const handleClientNameChange = (value: string) => {
    setClientNameInput(value);
    const timer = setTimeout(() => {
      setClientName(value || undefined);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handlePlateChange = (value: string) => {
    setPlateInput(value);
    const timer = setTimeout(() => {
      setPlate(value || undefined);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    const val = e.target.value;
    setStatusInput(val);
    setStatus(val ? (val as EstimateStatus) : undefined);
    setPage(0);
  };

  const handleRowClick = (id: number) => navigate(`/presupuestos/${id}`);
  const handleCreate = () => navigate("/presupuestos/nuevo");
  const handleInvoice = (id: number) => navigate(`/facturas/nuevo?estimateId=${id}`);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Presupuestos
      </Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
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
        onDelete={deleteEstimate}
        onInvoice={handleInvoice}
      />
    </Box>
  );
}
