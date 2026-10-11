import { IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { AppDataGrid } from "@/components/AppDataGrid";
import { MonoText } from "@/components/MonoText";
import { StatusBadge } from "@/components/StatusBadge";

import type { GridColDef } from "@mui/x-data-grid";
import type { InvoiceResponse } from "@/types/invoice";

interface InvoiceListProps {
  rows: InvoiceResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (row: InvoiceResponse) => void;
  onDelete: (id: number) => void;
}

export function InvoiceList({
  rows,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onDelete,
}: InvoiceListProps) {
  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha de creación",
      flex: 1,
      minWidth: 170,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString("es-AR"),
    },
    { field: "clientFullName", headerName: "Cliente", flex: 1.4, minWidth: 190 },
    {
      field: "vehiclePlate",
      headerName: "Patente",
      flex: 0.75,
      minWidth: 120,
      renderCell: (params) => <MonoText>{params.value ?? "—"}</MonoText>,
    },
    {
      field: "status",
      headerName: "Estado",
      flex: 0.8,
      minWidth: 140,
      renderCell: (params) => (
        <StatusBadge
          label={params.value === "PAGADA" ? "Pagada" : "Pendiente"}
          tone={params.value === "PAGADA" ? "ok" : "warn"}
        />
      ),
    },
    {
      field: "repairOrderId",
      headerName: "Orden de trabajo",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <MonoText>{params.value != null ? `#${params.value}` : "—"}</MonoText>
      ),
    },
    {
      field: "total",
      headerName: "Total",
      flex: 0.75,
      minWidth: 120,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <MonoText sx={{ display: "block", width: "100%", textAlign: "right" }}>
          {params.value != null ? `$${Number(params.value).toFixed(2)}` : "—"}
        </MonoText>
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 140,
      sortable: false,
      renderCell: (params) => {
        const isFromRepairOrder = params.row.repairOrderId != null;
        const isPaid = params.row.status === "PAGADA";
        return (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onRowClick(params.row);
              }}
              size="small"
            >
              <VisibilityIcon />
            </IconButton>
            <Tooltip
              title={
                isFromRepairOrder
                  ? "No se puede eliminar una factura de orden de trabajo"
                  : isPaid
                    ? "No se puede eliminar una factura pagada"
                    : "Eliminar"
              }
            >
              <span>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(params.row.id);
                  }}
                  color="error"
                  size="small"
                  disabled={isFromRepairOrder || isPaid}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </>
        );
      },
    },
  ];

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      rowCount={totalCount}
      paginationMode="server"
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={(model) => {
        onPageChange(model.page);
        onPageSizeChange(model.pageSize);
      }}
      pageSizeOptions={[12, 24, 48]}
      onRowClick={(params) => onRowClick(params.row)}
      emptyMessage="No se encuentra cargada una factura con esos datos."
    />
  );
}
