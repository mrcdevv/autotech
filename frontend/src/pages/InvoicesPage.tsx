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

import { InvoiceList } from "@/features/invoices/components/InvoiceList";
import { useInvoices } from "@/features/invoices/hooks/useInvoices";

import type { SelectChangeEvent } from "@mui/material";
import type { InvoiceResponse, InvoiceStatus } from "@/types/invoice";

export default function InvoicesPage() {
  const {
    invoices,
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
    deleteInvoice,
  } = useInvoices();

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
    setStatus(val ? (val as InvoiceStatus) : undefined);
    setPage(0);
  };

  const handleRowClick = (row: InvoiceResponse) => {
    if (row.repairOrderId != null) {
      navigate(`/ordenes-trabajo/${row.repairOrderId}?tab=factura`);
    } else {
      navigate(`/facturas/${row.id}`);
    }
  };

  const handleCreate = () => navigate("/facturas/nuevo");

  const handleDeleteConfirm = async () => {
    if (deleteDialogId != null) {
      await deleteInvoice(deleteDialogId);
      setDeleteDialogId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Facturas
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
            <MenuItem value="PAGADA">Pagada</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Crear nueva factura
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <InvoiceList
        rows={invoices}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRowClick={handleRowClick}
        onDelete={(id) => setDeleteDialogId(id)}
      />

      <Dialog open={deleteDialogId != null} onClose={() => setDeleteDialogId(null)}>
        <DialogTitle>Eliminar factura</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que querés eliminar esta factura? Esta acción no se puede deshacer.
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
