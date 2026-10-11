import { useState, useEffect, useRef } from "react";
import { GridActionsCellItem, GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import { Button, Alert, Snackbar } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Add as AddIcon, FileDownload as ExportIcon } from "@mui/icons-material";

import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { AppDataGrid } from "@/components/AppDataGrid";
import { MonoText } from "@/components/MonoText";
import { StatusBadge } from "@/components/StatusBadge";
import { PageShell } from "@/components/PageShell";
import { PageToolbar } from "@/components/PageToolbar";
import { useClients } from "@/features/clients/hooks/useClients";
import { clientsApi } from "@/api/clients";
import ClientForm from "./ClientForm";
import ClientDetailDialog from "./ClientDetailDialog";
import ClientFilters from "./ClientFilters";
import type { Client } from "@/features/clients/types/client";

export default function ClientList() {
    const { clients, totalElements, page, size, setPage, setSize, loading, error: fetchError, refetch, setQuery, query } = useClients();
    const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] =useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        // This effect should only run when the form is closed, not on initial mount.
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else if (!formOpen) {
            refetch();
        }
    }, [formOpen, refetch]);

    const columns: GridColDef<Client>[] = [
        { field: "dni", headerName: "Documento", flex: 0.9, minWidth: 140, renderCell: (params) => <MonoText>{params.value || "—"}</MonoText> },
        { field: "fullName", headerName: "Nombre completo", flex: 1.4, minWidth: 190, valueGetter: (_, row) => `${row.firstName} ${row.lastName}` },
        { field: "phone", headerName: "Teléfono", flex: 1, minWidth: 150, renderCell: (params) => <MonoText>{params.value || "—"}</MonoText> },
        { field: "email", headerName: "Correo electrónico", flex: 1.5, minWidth: 220, valueGetter: (val) => val || "—" },
        {
            field: "clientType",
            headerName: "Tipo de cliente",
            flex: 0.8,
            minWidth: 150,
            renderCell: (params) => {
                const tone = params.value === "PERSONAL" ? "info" : params.value === "EMPRESA" ? "ok" : "warn";
                return <StatusBadge label={params.value} tone={tone} />;
            }
        },
        {
            field: "actions",
            type: "actions",
            headerName: "Acciones",
            width: 150,
            sortable: false,
            getActions: (params) => [
                <GridActionsCellItem
                    key="view"
                    icon={<VisibilityIcon />}
                    label="Ver"
                    onClick={() => handleView(params.row)}
                />,
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Editar"
                    onClick={() => handleEdit(params.row)}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon />}
                    label="Eliminar"
                    onClick={() => handleDeleteClick([params.row.id])}
                    color="error"
                />,
            ],
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
        } catch {
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
        } catch {
            setActionError("Error al exportar a Excel");
        }
    };

    const handleFormSuccess = (savedClient: Client) => {
        setFormOpen(false);
        setSuccessMsg(`Cliente ${savedClient.firstName} ${savedClient.lastName} guardado correctamente.`);
    };

    return (
        <PageShell title="Clientes">
            <PageToolbar
                filters={<ClientFilters onSearch={setQuery} />}
                actions={
                    <>
                        <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>
                            Exportar a Excel
                        </Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                            Registrar cliente
                        </Button>
                    </>
                }
            />

            {fetchError && <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>}
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
            {query && !loading && totalElements === 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>No se encuentra ningún cliente registrado con esos datos.</Alert>
            )}

            <AppDataGrid
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
                emptyMessage="No hay clientes para mostrar."
            />

            {selectedIds.length > 0 && (
                <Button variant="contained" color="error" onClick={() => handleDeleteClick(selectedIds)} sx={{ mt: 2 }}>
                    Eliminar seleccionados ({selectedIds.length})
                </Button>
            )}

            <ClientForm open={formOpen} onClose={() => setFormOpen(false)} client={selectedClient} onSuccess={handleFormSuccess} />
            <ClientDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} client={selectedClient} />

            <AppConfirmDialog
                open={deleteDialogOpen}
                title="Eliminar clientes"
                message="¿Está seguro de eliminar los clientes seleccionados? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                destructive
                onConfirm={handleConfirmDelete}
                onCancel={() => { setDeleteDialogOpen(false); setSelectedIds([]); }}
            />

            <Snackbar
                open={!!successMsg}
                autoHideDuration={6000}
                onClose={() => setSuccessMsg(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccessMsg(null)} severity="success" sx={{ width: '100%' }}>
                    {successMsg}
                </Alert>
            </Snackbar>
        </PageShell>
    );
}
