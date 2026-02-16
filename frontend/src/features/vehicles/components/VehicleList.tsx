import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

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
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon />}
          label="Ver"
          onClick={() => onViewRow(params.row.id as number)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Editar"
          onClick={() => onEditRow(params.row.id as number)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => onDeleteRow(params.row.id as number)}
          color="error"
        />,
      ],
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
      disableRowSelectionOnClick
      sx={{ minHeight: 400 }}
    />
  );
}
