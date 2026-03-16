import { useState, useEffect } from "react";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import dayjs from "dayjs";
import { useNavigate } from "react-router";

import { employeesApi } from "@/api/employees";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useCalendarConfig } from "@/features/appointments/hooks/useCalendarConfig";
import { CalendarView } from "@/features/appointments/components/CalendarView";
import { AppointmentFormDialog } from "@/features/appointments/components/AppointmentFormDialog";
import { AppointmentDetailDialog } from "@/features/appointments/components/AppointmentDetailDialog";
import { AppointmentEditDialog } from "@/features/appointments/components/AppointmentEditDialog";
import { AppointmentActionsMenu } from "@/features/appointments/components/AppointmentActions";

import type { AppointmentResponse, CalendarViewMode } from "@/types/appointment";
import type { EmployeeResponse } from "@/features/employees/types";

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  day: "Vista diaria",
  week: "Vista semanal",
  month: "Vista mensual",
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const {
    appointments,
    loading,
    error,
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    employeeFilter,
    setEmployeeFilter,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    markVehicleArrived,
    cancelAppointment,
  } = useAppointments();

  const { config } = useCalendarConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuAppointment, setMenuAppointment] = useState<AppointmentResponse | null>(null);

  useEffect(() => {
    employeesApi.getAll(0, 100).then((res) => setEmployees(res.data.data.content)).catch(() => {});
  }, []);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const navigateDate = (direction: -1 | 1) => {
    const d = dayjs(currentDate);
    switch (viewMode) {
      case "day":
        setCurrentDate(d.add(direction, "day").toDate());
        break;
      case "week":
        setCurrentDate(d.add(direction * 7, "day").toDate());
        break;
      case "month":
        setCurrentDate(d.add(direction, "month").toDate());
        break;
    }
  };

  const getNavigationLabel = (): string => {
    const d = dayjs(currentDate);
    switch (viewMode) {
      case "day":
        return d.format("DD [de] MMMM YYYY");
      case "week": {
        const weekStart = d.startOf("week");
        const weekEnd = weekStart.add(6, "day");
        if (weekStart.month() === weekEnd.month()) {
          return `${weekStart.format("DD")} - ${weekEnd.format("DD [de] MMMM YYYY")}`;
        }
        return `${weekStart.format("DD MMM")} - ${weekEnd.format("DD MMM YYYY")}`;
      }
      case "month":
        return d.format("MMMM YYYY");
    }
  };

  const handleCreate = async (data: Parameters<typeof createAppointment>[0]) => {
    try {
      await createAppointment(data);
      showSnackbar("Cita creada", "success");
    } catch {
      showSnackbar("Error al crear la cita", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAppointment(id);
      showSnackbar("Cita eliminada", "success");
    } catch {
      showSnackbar("Error al eliminar la cita", "error");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelAppointment(id);
      showSnackbar("Cita cancelada", "success");
    } catch {
      showSnackbar("Error al cancelar la cita", "error");
    }
  };

  const handleMarkVehicleArrived = async (id: number) => {
    try {
      await markVehicleArrived(id);
      showSnackbar("Vehículo marcado como recibido", "success");
    } catch {
      showSnackbar("Error al actualizar la cita", "error");
    }
  };

  const handleEdit = (appointment: AppointmentResponse) => {
    setSelectedAppointment(appointment);
    setEditOpen(true);
  };

  const handleUpdate = async (id: number, data: { startTime: string; endTime: string }) => {
    try {
      await updateAppointment(id, data);
      showSnackbar("Cita actualizada", "success");
    } catch {
      showSnackbar("Error al actualizar la cita", "error");
    }
  };

  const handleCreateWorkOrder = (appointment: AppointmentResponse) => {
    const params = new URLSearchParams();
    if (appointment.clientId) params.set("clientId", String(appointment.clientId));
    if (appointment.vehicleId) params.set("vehicleId", String(appointment.vehicleId));
    if (appointment.purpose) params.set("reason", appointment.purpose);
    navigate(`/ordenes-trabajo/nueva?${params.toString()}`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, appointment: AppointmentResponse) => {
    setMenuAnchor(event.currentTarget);
    setMenuAppointment(appointment);
  };

  const businessStartHour = config?.startTime ? parseInt(config.startTime.split(":")[0] ?? "8", 10) : 8;
  const businessEndHour = config?.endTime ? parseInt(config.endTime.split(":")[0] ?? "20", 10) : 20;

  const todayLabel = dayjs().format("dddd, DD MMM, YYYY");

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h3" sx={{ textTransform: "capitalize" }}>
            {todayLabel}
          </Typography>
          <Chip
            label="Hoy"
            size="small"
            variant="outlined"
            onClick={() => setCurrentDate(new Date())}
            sx={{ fontWeight: 500, cursor: "pointer" }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Autocomplete
            options={employees}
            getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
            value={employees.find((e) => e.id === employeeFilter) ?? null}
            onChange={(_e, v) => setEmployeeFilter(v?.id ?? null)}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} placeholder="Filtrar empleado" size="small" sx={{ width: 200 }} />
            )}
            size="small"
            sx={{ width: 200 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            Nueva cita
          </Button>
        </Box>
      </Box>

      {/* Navigation row */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" onClick={() => navigateDate(-1)} sx={{ color: "text.secondary" }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              minWidth: 200,
              textAlign: "center",
              textTransform: "capitalize",
              fontSize: "1.1rem",
            }}
          >
            {getNavigationLabel()}
          </Typography>
          <IconButton size="small" onClick={() => navigateDate(1)} sx={{ color: "text.secondary" }}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>

        <Select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as CalendarViewMode)}
          size="small"
          sx={{ minWidth: 140, fontSize: "0.85rem" }}
        >
          <MenuItem value="day">{VIEW_LABELS.day}</MenuItem>
          <MenuItem value="week">{VIEW_LABELS.week}</MenuItem>
          <MenuItem value="month">{VIEW_LABELS.month}</MenuItem>
        </Select>
      </Box>

      <CalendarView
        appointments={appointments}
        viewMode={viewMode}
        currentDate={currentDate}
        loading={loading}
        businessStartHour={businessStartHour}
        businessEndHour={businessEndHour}
        onAppointmentClick={(apt) => {
          setSelectedAppointment(apt);
          setDetailOpen(true);
        }}
        onMenuOpen={handleMenuOpen}
      />

      <AppointmentActionsMenu
        anchorEl={menuAnchor}
        appointment={menuAppointment}
        onClose={() => {
          setMenuAnchor(null);
          setMenuAppointment(null);
        }}
        onMarkVehicleArrived={handleMarkVehicleArrived}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onCreateWorkOrder={handleCreateWorkOrder}
      />

      <AppointmentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        defaultDurationMinutes={config?.defaultAppointmentDurationMinutes ?? 60}
      />

      <AppointmentDetailDialog
        open={detailOpen}
        appointment={selectedAppointment}
        onClose={() => {
          setDetailOpen(false);
          setSelectedAppointment(null);
        }}
        onEdit={handleEdit}
      />

      <AppointmentEditDialog
        open={editOpen}
        appointment={selectedAppointment}
        onClose={() => {
          setEditOpen(false);
          setSelectedAppointment(null);
        }}
        onSave={handleUpdate}
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
    </Box>
  );
}
