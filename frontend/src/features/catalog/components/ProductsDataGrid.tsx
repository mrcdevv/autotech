import { GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { AppDataGrid } from "@/components/AppDataGrid";
import { MonoText } from "@/components/MonoText";

import type { GridColDef } from "@mui/x-data-grid";
import type { ProductResponse } from "@/types/catalog";

interface ProductsDataGridProps {
  rows: ProductResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEditRow: (id: number) => void;
  onDeleteRow: (id: number) => void;
}

export function ProductsDataGrid({
  rows,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEditRow,
  onDeleteRow,
}: ProductsDataGridProps) {
  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "description", headerName: "Descripción", flex: 2 },
    {
      field: "quantity",
      headerName: "Cantidad",
      width: 120,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <MonoText sx={{ display: "block", width: "100%", textAlign: "right" }}>
          {params.value ?? "—"}
        </MonoText>
      ),
    },
    {
      field: "unitPrice",
      headerName: "Precio unitario",
      width: 150,
      type: "number",
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
      emptyMessage="No hay productos para mostrar."
    />
  );
}
