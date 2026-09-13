import { GridActionsCellItem } from "@mui/x-data-grid";
import { Tooltip, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { AppDataGrid } from "@/components/AppDataGrid";

import type { GridColDef } from "@mui/x-data-grid";
import type { VehicleResponse } from "@/types/vehicle";

interface VehicleListProps {
  rows: VehicleResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEditRow: (id: number) => void;
  onDeleteRow: (id: number) => void;
  onViewRow: (id: number) => void;
}

export function VehicleList({
  rows,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEditRow,
  onDeleteRow,
  onViewRow,
}: VehicleListProps) {
  const columns: GridColDef[] = [
    { field: "plate", headerName: "Patente", flex: 1 },
    { field: "model", headerName: "Modelo", flex: 1 },
    {
      field: "owner",
      headerName: "Propietario",
      flex: 1.5,
      valueGetter: (_value: unknown, row: VehicleResponse) =>
        `${row.clientFirstName} ${row.clientLastName}`,
    },
    { field: "clientDni", headerName: "Documento Propietario", flex: 1 },
    {
      field: "inRepair",
      headerName: "En reparación",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Sí" : "No"}
          size="small"
          color={params.value ? "warning" : "success"}
          variant={params.value ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 150,
      getActions: (params) => [
        <Tooltip title="Ver" key="view">
          <GridActionsCellItem
            icon={<VisibilityIcon />}
            label="Ver"
            onClick={() => onViewRow(params.row.id as number)}
          />
        </Tooltip>,
        <Tooltip title="Editar" key="edit">
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Editar"
            onClick={() => onEditRow(params.row.id as number)}
          />
        </Tooltip>,
        <Tooltip title="Eliminar" key="delete">
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Eliminar"
            onClick={() => onDeleteRow(params.row.id as number)}
            color="error"
          />
        </Tooltip>,
      ],
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
      disableRowSelectionOnClick
      emptyMessage="No hay vehículos para mostrar."
    />
  );
}
