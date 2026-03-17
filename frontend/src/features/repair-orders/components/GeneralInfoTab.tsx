import {
  Box,
  Typography,
  TextField,
  Divider,
  CircularProgress,
  Link,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { DataGrid } from "@mui/x-data-grid";

import type { GridColDef } from "@mui/x-data-grid";
import type { RepairOrderDetailResponse } from "../types";

interface GeneralInfoTabProps {
  order: RepairOrderDetailResponse | null;
  loading: boolean;
}

export function GeneralInfoTab({ order, loading }: GeneralInfoTabProps) {
  if (loading) return <CircularProgress />;
  if (!order) return <Typography>No se encontró la orden de trabajo</Typography>;

  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      flex: 1,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString("es-AR"),
      sortable: true,
    },
    {
      field: "repairOrderId",
      headerName: "Orden de Trabajo",
      flex: 1,
      renderCell: (params) => (
        <Link href={`/ordenes-trabajo/${params.value}`} underline="hover">
          OT-{params.value}
        </Link>
      ),
    },
    {
      field: "reason",
      headerName: "Servicio / Motivo",
      flex: 2,
      valueGetter: (value: string | null) => value || "—",
    },
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Datos del Cliente
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Nombre completo"
            value={`${order.clientFirstName} ${order.clientLastName}`}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="DNI"
            value={order.clientDni || "—"}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Teléfono"
            value={order.clientPhone}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Correo electrónico"
            value={order.clientEmail || "—"}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Datos del Vehículo
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Vehículo"
            value={
              [order.vehicleYear, order.vehicleBrandName, order.vehicleModel]
                .filter(Boolean)
                .join(" ") || "—"
            }
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Patente"
            value={order.vehiclePlate}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Número de chasis"
            value={order.vehicleChassisNumber || "—"}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Historial de Trabajo
      </Typography>
      <DataGrid
        rows={order.workHistory.map((entry) => ({
          id: entry.repairOrderId,
          ...entry,
        }))}
        columns={columns}
        autoHeight
        disableRowSelectionOnClick
        initialState={{
          sorting: {
            sortModel: [{ field: "createdAt", sort: "desc" }],
          },
        }}
        pageSizeOptions={[5, 10]}
        sx={{ mt: 1 }}
      />
    </Box>
  );
}
