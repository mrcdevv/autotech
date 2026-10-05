import { Link } from "@mui/material";

import { AppDataGrid } from "@/components/AppDataGrid";
import { MonoText } from "@/components/MonoText";
import { StatusBadge } from "@/components/StatusBadge";

import { STATUS_META } from "../statusMeta";

import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import type { RepairOrderResponse } from "../types";

interface RepairOrderHistoryProps {
  rows: RepairOrderResponse[];
  loading: boolean;
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
}

export function RepairOrderHistory({
  rows,
  loading,
  rowCount,
  paginationModel,
  onPaginationModelChange,
}: RepairOrderHistoryProps) {
  const columns: GridColDef<RepairOrderResponse>[] = [
    {
      field: "id",
      headerName: "OT",
      width: 110,
      renderCell: (params) => (
        <Link
          href={`/ordenes-trabajo/${params.value}`}
          underline="hover"
          sx={{ fontWeight: 500 }}
        >
          <MonoText>OT-{params.value}</MonoText>
        </Link>
      ),
    },
    {
      field: "clientLastName",
      headerName: "Cliente",
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => `${row.clientFirstName} ${row.clientLastName}`.trim(),
    },
    {
      field: "vehicleModel",
      headerName: "Vehículo",
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) =>
        [row.vehicleYear, row.vehicleBrandName, row.vehicleModel].filter(Boolean).join(" ") || "—",
    },
    {
      field: "vehiclePlate",
      headerName: "Patente",
      width: 130,
      renderCell: (params) => <MonoText>{params.value}</MonoText>,
    },
    {
      field: "status",
      headerName: "Estado",
      width: 150,
      renderCell: (params) => {
        const meta = STATUS_META[params.value as RepairOrderResponse["status"]];
        return <StatusBadge tone={meta.tone} label={meta.label} />;
      },
    },
    {
      field: "updatedAt",
      headerName: "Última actualización",
      width: 180,
      renderCell: (params) => (
        <MonoText>{new Date(params.value).toLocaleDateString("es-AR")}</MonoText>
      ),
    },
  ];

  return (
    <AppDataGrid<RepairOrderResponse>
      rows={rows}
      columns={columns}
      loading={loading}
      rowCount={rowCount}
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={[12, 24, 48]}
      emptyMessage="No hay órdenes finalizadas para mostrar."
    />
  );
}
