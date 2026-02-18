import { Chip, IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { DataGrid } from "@mui/x-data-grid";

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
      width: 180,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString("es-AR"),
    },
    { field: "clientFullName", headerName: "Cliente", flex: 1 },
    { field: "vehiclePlate", headerName: "Patente", width: 120 },
    { field: "vehicleModel", headerName: "Modelo", width: 150 },
    {
      field: "status",
      headerName: "Estado",
      width: 140,
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
      width: 160,
      valueFormatter: (value: number | null) => (value != null ? `#${value}` : "—"),
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
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
    <DataGrid
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
      sx={{ minHeight: 400 }}
    />
  );
}
