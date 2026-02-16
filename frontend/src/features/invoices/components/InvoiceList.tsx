import { Chip, IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { DataGrid } from "@mui/x-data-grid";

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
      width: 180,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString("es-AR"),
    },
    { field: "clientFullName", headerName: "Cliente", flex: 1 },
    {
      field: "vehiclePlate",
      headerName: "Patente",
      width: 120,
      valueFormatter: (value: string | null) => value ?? "—",
    },
    {
      field: "status",
      headerName: "Estado",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value === "PAGADA" ? "Pagada" : "Pendiente"}
          color={params.value === "PAGADA" ? "success" : "warning"}
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
      onRowClick={(params) => onRowClick(params.row)}
      sx={{ minHeight: 400 }}
    />
  );
}
