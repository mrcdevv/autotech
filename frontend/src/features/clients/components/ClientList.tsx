import { useState } from "react";
import { DataGrid, GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import { Box, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Alert, Snackbar } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Add as AddIcon, FileDownload as ExportIcon } from "@mui/icons-material";
import { useClients } from "@/features/clients/hooks/useClients";
import { clientsApi } from "@/api/clients";
import ClientForm from "./ClientForm";
import ClientDetailDialog from "./ClientDetailDialog";
import ClientFilters from "./ClientFilters";
import type { Client } from "@/features/clients/types/client";

export default function ClientList() {
    const { clients, totalElements, page, size, setPage, setSize, loading, error: fetchError, refetch, setQuery } = useClients();
    const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const columns: GridColDef<Client>[] = [
        { field: "dni", headerName: "Documento", width: 150, valueGetter: (val) => val || "—" },
        { field: "fullName", headerName: "Nombre Completo", width: 200, valueGetter: (_, row) => `${row.firstName} ${row.lastName}` },
        { field: "phone", headerName: "Teléfono", width: 150 },
        { field: "email", headerName: "Correo Electrónico", width: 200, valueGetter: (val) => val || "—" },
        {
            field: "clientType",
            headerName: "Tipo Cliente",
            width: 150,
            renderCell: (params) => {
                const color = params.value === "PERSONAL" ? "primary" : params.value === "EMPRESA" ? "success" : "warning";
                return <Chip label={params.value} color={color} size="small" />;
            }
        },
        {
            field: "actions",
            headerName: "Acción",
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleView(params.row)} size="small" color="info"><VisibilityIcon /></IconButton>
                    <IconButton onClick={() => handleEdit(params.row)} size="small" color="primary"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDeleteClick([params.row.id])} size="small" color="error"><DeleteIcon /></IconButton>
                </Box>
            )
        }
    ];

    const handlePaginationModelChange = (model: GridPaginationModel) => {
        setPage(model.page);
        setSize(model.pageSize);
    };

    const handleCreate = () => {
        setSelectedClient(null);
        setFormOpen(true);
    };

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setFormOpen(true);
    };

    const handleView = (client: Client) => {
        setSelectedClient(client);
        setDetailOpen(true);
    };

    const handleDeleteClick = (ids: GridRowSelectionModel) => {
        setSelectedIds(ids);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedIds.length === 0) return;
        setActionError(null);
        try {
            const results = await Promise.allSettled(selectedIds.map(id => clientsApi.delete(Number(id))));
            const failures = results.filter(r => r.status === "rejected");

            if (failures.length > 0) {
                setActionError("No se pudieron eliminar algunos clientes (posiblemente tengan registros asociados).");
            } else {
                setSuccessMsg("Cliente(s) eliminado(s) correctamente.");
                setDeleteDialogOpen(false);
                setSelectedIds([]);
                refetch();
            }
        } catch (err) {
            setActionError("Error al eliminar clientes.");
        }
    };

    const handleExport = async () => {
        try {
            const response = await clientsApi.exportToExcel();
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'clientes.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            setActionError("Error al exportar a Excel");
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Clientes</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <ClientFilters onSearch={setQuery} />
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Registrar Cliente</Button>
                <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>Exportar a Excel</Button>
            </Box>

            {fetchError && <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>}
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={clients}
                    columns={columns}
                    rowCount={totalElements}
                    loading={loading}
                    pageSizeOptions={[12, 24, 48]}
                    paginationModel={{ page, pageSize: size }}
                    paginationMode="server"
                    onPaginationModelChange={handlePaginationModelChange}
                    checkboxSelection
                    onRowSelectionModelChange={setSelectedIds}
                    rowSelectionModel={selectedIds}
                    disableRowSelectionOnClick
                />
            </Box>

            {selectedIds.length > 0 && (
                <Button variant="contained" color="error" onClick={() => handleDeleteClick(selectedIds)} sx={{ mt: 2 }}>
                    Eliminar seleccionados ({selectedIds.length})
                </Button>
            )}

            <ClientForm open={formOpen} onClose={() => setFormOpen(false)} client={selectedClient} onSuccess={() => { setFormOpen(false); refetch(); setSuccessMsg("Operación exitosa"); }} />
            <ClientDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} client={selectedClient} />

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>¿Está seguro de eliminar los clientes seleccionados?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg(null)} message={successMsg} />
        </Box>
    );
}
