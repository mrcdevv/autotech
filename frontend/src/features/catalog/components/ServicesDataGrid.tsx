import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import type { GridColDef } from "@mui/x-data-grid";
import type { CatalogServiceResponse } from "@/types/catalog";

interface ServicesDataGridProps {
  rows: CatalogServiceResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEditRow: (id: number) => void;
  onDeleteRow: (id: number) => void;
}

export function ServicesDataGrid({
  rows,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEditRow,
  onDeleteRow,
}: ServicesDataGridProps) {
  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "description", headerName: "Descripción", flex: 2 },
    {
      field: "price",
      headerName: "Precio",
      width: 150,
      type: "number",
      valueFormatter: (value: number | null) => (value != null ? `$${value.toFixed(2)}` : "—"),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 120,
      getActions: (params) => [
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
