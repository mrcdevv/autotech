import { GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LockResetIcon from "@mui/icons-material/LockReset";

import { AppDataGrid } from "@/components/AppDataGrid";
import { MonoText } from "@/components/MonoText";
import { StatusBadge } from "@/components/StatusBadge";

import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import type { EmployeeResponse } from "@/features/employees/types";
import type { PageResponse } from "@/types/api";

interface EmployeeListProps {
  data: PageResponse<EmployeeResponse> | null;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationChange: (model: GridPaginationModel) => void;
  onView: (employee: EmployeeResponse) => void;
  onEdit: (employee: EmployeeResponse) => void;
  onDelete: (id: number) => void;
  onResetPassword: (employee: EmployeeResponse) => void;
}

export function EmployeeList({
  data,
  loading,
  paginationModel,
  onPaginationChange,
  onView,
  onEdit,
  onDelete,
  onResetPassword,
}: EmployeeListProps) {
  const columns: GridColDef[] = [
    { field: "dni", headerName: "Documento", flex: 1, renderCell: (params) => <MonoText>{params.value || "—"}</MonoText> },
    {
      field: "fullName",
      headerName: "Nombre Completo",
      flex: 1.5,
      valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
    },
    { field: "phone", headerName: "Teléfono", flex: 1, renderCell: (params) => <MonoText>{params.value || "—"}</MonoText> },
    { field: "email", headerName: "Correo Electrónico", flex: 1.5 },
    {
      field: "status",
      headerName: "Estado",
      flex: 0.8,
      renderCell: (params) => (
        <StatusBadge
          label={params.value === "ACTIVO" ? "Activo" : "Inactivo"}
          tone={params.value === "ACTIVO" ? "ok" : "bad"}
        />
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Acción",
      flex: 1,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon />}
          label="Ver"
          onClick={() => onView(params.row as EmployeeResponse)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Editar"
          onClick={() => onEdit(params.row as EmployeeResponse)}
        />,
        <GridActionsCellItem
          key="reset-password"
          icon={<LockResetIcon />}
          label="Resetear contraseña"
          onClick={() => onResetPassword(params.row as EmployeeResponse)}
          showInMenu
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => onDelete((params.row as EmployeeResponse).id)}
          showInMenu
        />,
      ],
    },
  ];

  return (
    <AppDataGrid
      rows={data?.content ?? []}
      columns={columns}
      rowCount={data?.totalElements ?? 0}
      loading={loading}
      pageSizeOptions={[12]}
      paginationModel={paginationModel}
      paginationMode="server"
      onPaginationModelChange={onPaginationChange}
      disableRowSelectionOnClick
      emptyMessage="No hay empleados para mostrar."
    />
  );
}
