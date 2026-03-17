import { DataGrid } from "@mui/x-data-grid";
import { Box, IconButton, Chip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import type { GridColDef } from "@mui/x-data-grid";
import type { PaymentResponse } from "@/types/payment";

interface PaymentHistoryGridProps {
  payments: PaymentResponse[];
  loading: boolean;
  onEdit: (payment: PaymentResponse) => void;
  onDelete: (paymentId: number, performedBy: number) => void;
}

export function PaymentHistoryGrid({
  payments,
  loading,
  onEdit,
  onDelete,
}: PaymentHistoryGridProps) {
  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha y hora",
      width: 180,
      valueFormatter: (value: string) =>
        new Date(value).toLocaleString("es-AR", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
    {
      field: "payerName",
      headerName: "Nombre del pagador",
      flex: 1,
      valueFormatter: (value: string | null) => value ?? "—",
    },
    {
      field: "registeredByEmployeeFullName",
      headerName: "Registrado por",
      flex: 1,
      valueFormatter: (value: string | null) => value ?? "—",
    },
    {
      field: "amount",
      headerName: "Monto",
      width: 130,
      valueFormatter: (value: number) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: "paymentType",
      headerName: "Tipo de pago",
      width: 170,
      renderCell: (params) => (
        <Chip
          label={
            params.value === "EFECTIVO" ? "Efectivo" : "Cuenta bancaria"
          }
          color={params.value === "EFECTIVO" ? "default" : "primary"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onEdit(params.row);
            }}
            size="small"
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete(
                params.row.id,
                params.row.registeredByEmployeeId,
              );
            }}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  if (payments.length === 0 && !loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Historial de pagos
        </Typography>
        <Typography color="text.secondary">
          No se registraron pagos para esta factura.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Historial de pagos
      </Typography>
      <DataGrid
        rows={payments}
        columns={columns}
        loading={loading}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
      />
    </Box>
  );
}
