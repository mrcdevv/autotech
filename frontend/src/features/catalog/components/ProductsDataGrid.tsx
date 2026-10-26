import { Box } from "@mui/material";
import { GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import TuneIcon from "@mui/icons-material/Tune";
import HistoryIcon from "@mui/icons-material/History";

import { AppDataGrid } from "@/components/AppDataGrid";
import { MonoText } from "@/components/MonoText";
import { StatusBadge } from "@/components/StatusBadge";
import { moneyColumn } from "@/utils/gridColumns";

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
  onEditRow?: (id: number) => void;
  onDeleteRow?: (id: number) => void;
  onAdjustStock?: (id: number) => void;
  onShowMovements?: (id: number) => void;
}

function numberColumn(field: keyof ProductResponse, headerName: string, width = 110): GridColDef {
  return {
    field,
    headerName,
    width,
    type: "number",
    align: "right",
    headerAlign: "right",
    renderCell: (params) => (
      <MonoText
        sx={{
          display: "block",
          width: "100%",
          textAlign: "right",
          color: typeof params.value === "number" && params.value < 0 ? "error.main" : undefined,
        }}
      >
        {params.value ?? "—"}
      </MonoText>
    ),
  };
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
  onAdjustStock,
  onShowMovements,
}: ProductsDataGridProps) {
  const columns: GridColDef<ProductResponse>[] = [
    {
      field: "name",
      headerName: "Nombre",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {params.row.name}
          </Box>
          {params.row.lowStock && <StatusBadge label="Stock bajo" tone="bad" />}
        </Box>
      ),
    },
    { field: "description", headerName: "Descripción", flex: 1.5 },
    numberColumn("quantity", "En stock"),
    numberColumn("reservedQuantity", "Reservado"),
    numberColumn("availableQuantity", "Disponible"),
    numberColumn("minStock", "Stock mín."),
    moneyColumn({
      field: "unitPrice",
      headerName: "Precio unitario",
      overrides: { width: 150 },
    }),
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 170,
      getActions: (params) => [
        ...(onShowMovements
          ? [
              <GridActionsCellItem
                key="movements"
                icon={<HistoryIcon />}
                label="Movimientos de stock"
                onClick={() => onShowMovements(params.row.id)}
              />,
            ]
          : []),
        ...(onAdjustStock
          ? [
              <GridActionsCellItem
                key="adjust"
                icon={<TuneIcon />}
                label="Ajustar stock"
                onClick={() => onAdjustStock(params.row.id)}
              />,
            ]
          : []),
        ...(onEditRow
          ? [
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon />}
                label="Editar"
                onClick={() => onEditRow(params.row.id)}
              />,
            ]
          : []),
        ...(onDeleteRow
          ? [
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Eliminar"
                onClick={() => onDeleteRow(params.row.id)}
                color="error"
              />,
            ]
          : []),
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
