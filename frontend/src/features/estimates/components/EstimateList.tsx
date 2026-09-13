import { Chip, IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptIcon from "@mui/icons-material/Receipt";

import { AppDataGrid } from "@/components/AppDataGrid";

import type { GridColDef } from "@mui/x-data-grid";
import type { EstimateResponse } from "@/types/estimate";

interface EstimateListProps {
  rows: EstimateResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (id: number) => void;
  onDelete: (id: number) => void;
  onInvoice: (id: number) => void;
}

export function EstimateList({
  rows,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onDelete,
  onInvoice,
}: EstimateListProps) {
  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha de creación",
      flex: 1,
      minWidth: 170,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString("es-AR"),
    },
    { field: "clientFullName", headerName: "Cliente", flex: 1.4, minWidth: 190 },
    { field: "vehiclePlate", headerName: "Patente", flex: 0.75, minWidth: 120 },
    { field: "vehicleModel", headerName: "Modelo", flex: 0.9, minWidth: 150 },
    {
      field: "status",
      headerName: "Estado",
      flex: 0.8,
      minWidth: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === "ACEPTADO"
              ? "success"
              : params.value === "RECHAZADO"
                ? "error"
                : "warning"
          }
          size="small"
        />
      ),
    },
    {
      field: "repairOrderId",
      headerName: "Orden de trabajo",
      flex: 1,
      minWidth: 160,
      valueFormatter: (value: number | null) => (value != null ? `#${value}` : "—"),
    },
    {
      field: "total",
      headerName: "Total",
      flex: 0.75,
      minWidth: 120,
      valueFormatter: (value: number | null) =>
        value != null ? `$${Number(value).toFixed(2)}` : "—",
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(params.row.id);
            }}
            size="small"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete(params.row.id);
            }}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
          <Tooltip
            title={
              params.row.status !== "ACEPTADO"
                ? "Solo se pueden facturar presupuestos aceptados"
                : "Facturar"
            }
          >
            <span>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onInvoice(params.row.id);
                }}
                size="small"
                disabled={params.row.status !== "ACEPTADO"}
                color="primary"
              >
                <ReceiptIcon />
              </IconButton>
            </span>
          </Tooltip>
        </>
      ),
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
      onRowClick={(params) => onRowClick(params.row.id)}
      emptyMessage="No se encuentra cargado un presupuesto con esos datos."
    />
  );
}
