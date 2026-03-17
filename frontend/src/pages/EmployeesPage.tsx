import { useState, useCallback, useEffect } from "react";

import { Box, Typography, Button, Alert, Snackbar } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import { employeesApi } from "@/api/employees";
import { EmployeeList } from "@/features/employees/EmployeeList";
import { EmployeeForm } from "@/features/employees/EmployeeForm";
import { EmployeeFilters } from "@/features/employees/EmployeeFilters";
import { EmployeeDetail } from "@/features/employees/EmployeeDetail";
import { WarningDialog } from "@/components/Shared/WarningDialog";
import type { EmployeeResponse, EmployeeRequest } from "@/features/employees/types";
import type { PageResponse, ApiResponse } from "@/types/api";
import type { GridPaginationModel } from "@mui/x-data-grid";

export default function EmployeesPage() {
  const [data, setData] = useState<PageResponse<EmployeeResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 12,
  });

  const [filters, setFilters] = useState({ dni: "", roleId: "" as number | "", status: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (filters.dni) {
        res = await employeesApi.searchByDni(filters.dni, paginationModel.page);
      } else if (filters.status) {
        res = await employeesApi.filterByStatus(filters.status, paginationModel.page);
      } else if (filters.roleId !== "") {
        res = await employeesApi.filterByRole(filters.roleId as number, paginationModel.page);
      } else {
        res = await employeesApi.getAll(paginationModel.page);
      }
      setData(res.data.data);
    } catch {
      showSnackbar("Error al cargar empleados", "error");
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback(
    (newFilters: { dni: string; roleId: number | ""; status: string }) => {
      setFilters(newFilters);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    []
  );

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setSelectedEmployee(null);
    setFormOpen(true);
  };

  const handleEdit = (employee: EmployeeResponse) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  };

  const handleView = (employee: EmployeeResponse) => {
    setSelectedEmployee(employee);
    setDetailOpen(true);
  };

  const handleDelete = (id: number) => {
    setEmployeeToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      try {
        await employeesApi.delete(employeeToDelete);
        showSnackbar("Empleado eliminado", "success");
        fetchData();
      } catch {
        showSnackbar("Error al eliminar el empleado", "error");
      }
    }
    setDeleteConfirmationOpen(false);
    setEmployeeToDelete(null);
  };

  const handleSave = async (request: EmployeeRequest) => {
    try {
      if (selectedEmployee) {
        await employeesApi.update(selectedEmployee.id, request);
        showSnackbar("Empleado actualizado", "success");
      } else {
        await employeesApi.create(request);
        showSnackbar("Empleado creado", "success");
      }
      setFormOpen(false);
      fetchData();
    } catch (err) {
      const error = err as { response?: { data?: ApiResponse<unknown> } };
      const message = error.response?.data?.message ?? "Error al guardar el empleado";

      if (message.includes("El DNI ya se encuentra registrado")) {
        setWarningDialogOpen(true);
      } else {
        showSnackbar(message, "error");
      }
    }
  };

  const handleExport = async () => {
    try {
      const res = await employeesApi.exportToExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "empleados.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showSnackbar("Error al exportar a Excel", "error");
    }
  };

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
  };

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Empleados
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <EmployeeFilters onFilterChange={handleFilterChange} />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button startIcon={<FileDownloadIcon />} onClick={handleExport}>
            Exportar a Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Nuevo Empleado
          </Button>
        </Box>
      </Box>

      <EmployeeList
        data={data}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationChange={handlePaginationChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EmployeeForm
        open={formOpen}
        employee={selectedEmployee}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <EmployeeDetail
        open={detailOpen}
        employee={selectedEmployee}
        onClose={() => setDetailOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <WarningDialog
        open={warningDialogOpen}
        onClose={() => setWarningDialogOpen(false)}
        onConfirm={() => setWarningDialogOpen(false)}
        title="DNI ya registrado"
        message="El DNI que ha ingresado ya se encuentra registrado en el sistema. Por favor, verifique los datos e intente nuevamente."
      />

      <WarningDialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message="¿Está seguro de que desea eliminar este empleado? Esta acción no se puede deshacer."
      />
    </Box>
  );
}
