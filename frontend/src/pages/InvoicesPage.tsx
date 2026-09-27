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
    <PageShell title="Facturas">
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
                <MenuItem value="PAGADA">Pagada</MenuItem>
              </Select>
            </FormControl>
          </>
        }
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Crear nueva factura
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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

      <AppConfirmDialog
        open={deleteDialogId != null}
        title="Eliminar factura"
        message="¿Estás seguro de que querés eliminar esta factura? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogId(null)}
      />
    </PageShell>
  );
}
