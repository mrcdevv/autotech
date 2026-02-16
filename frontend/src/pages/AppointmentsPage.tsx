import { useState, useEffect } from "react";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import dayjs from "dayjs";

import { employeesApi } from "@/api/employees";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useCalendarConfig } from "@/features/appointments/hooks/useCalendarConfig";
import { CalendarView } from "@/features/appointments/components/CalendarView";
import { AppointmentFormDialog } from "@/features/appointments/components/AppointmentFormDialog";
import { AppointmentDetailDialog } from "@/features/appointments/components/AppointmentDetailDialog";

import type { AppointmentResponse, CalendarViewMode } from "@/types/appointment";
import type { EmployeeResponse } from "@/features/employees/types";

export default function AppointmentsPage() {
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
    deleteAppointment,
    markClientArrived,
    markVehicleArrived,
  } = useAppointments();

  const { config } = useCalendarConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

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

  const getDateLabel = (): string => {
    const d = dayjs(currentDate);
    switch (viewMode) {
      case "day":
        return d.format("dddd DD/MM/YYYY");
      case "week": {
        const weekStart = d.startOf("week");
        const weekEnd = weekStart.add(6, "day");
        return `${weekStart.format("DD/MM")} — ${weekEnd.format("DD/MM/YYYY")}`;
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

  const handleMarkClientArrived = async (id: number, arrived: boolean) => {
    try {
      await markClientArrived(id, arrived);
    } catch {
      showSnackbar("Error al actualizar la cita", "error");
    }
  };

  const handleMarkVehicleArrived = async (id: number) => {
    try {
      await markVehicleArrived(id);
    } catch {
      showSnackbar("Error al actualizar la cita", "error");
    }
  };

  const handleEdit = (appointment: AppointmentResponse) => {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  };

  const businessStartHour = config?.startTime ? parseInt(config.startTime.split(":")[0] ?? "8", 10) : 8;
  const businessEndHour = config?.endTime ? parseInt(config.endTime.split(":")[0] ?? "20", 10) : 20;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Calendario
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v: CalendarViewMode | null) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="day">Día</ToggleButton>
          <ToggleButton value="week">Semana</ToggleButton>
          <ToggleButton value="month">Mes</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" onClick={() => navigateDate(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 160, textAlign: "center" }}>
            {getDateLabel()}
          </Typography>
          <IconButton size="small" onClick={() => navigateDate(1)}>
            <ChevronRightIcon />
          </IconButton>
          <Button size="small" onClick={() => setCurrentDate(new Date())}>
            Hoy
          </Button>
        </Box>

        <Autocomplete
          options={employees}
          getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
          value={employees.find((e) => e.id === employeeFilter) ?? null}
          onChange={(_e, v) => setEmployeeFilter(v?.id ?? null)}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField {...params} label="Filtrar por empleado" size="small" sx={{ minWidth: 220 }} />
          )}
          size="small"
          sx={{ minWidth: 220 }}
        />

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          Nueva cita
        </Button>
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
        onMarkClientArrived={handleMarkClientArrived}
        onMarkVehicleArrived={handleMarkVehicleArrived}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
