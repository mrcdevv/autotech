import { useState, useEffect, useCallback } from "react";

import { appointmentsApi } from "@/api/appointments";

import type {
  AppointmentResponse,
  AppointmentRequest,
  AppointmentUpdateRequest,
  CalendarViewMode,
} from "@/types/appointment";

export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(currentDate, viewMode);
      const res = await appointmentsApi.getByDateRange(
        start.toISOString(),
        end.toISOString(),
        employeeFilter ?? undefined,
      );
      setAppointments(res.data.data);
    } catch {
      setError("Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, employeeFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = async (data: AppointmentRequest) => {
    await appointmentsApi.create(data);
    await fetchAppointments();
  };

  const updateAppointment = async (id: number, data: AppointmentUpdateRequest) => {
    await appointmentsApi.update(id, data);
    await fetchAppointments();
  };

  const deleteAppointment = async (id: number) => {
    await appointmentsApi.delete(id);
    await fetchAppointments();
  };

  const markClientArrived = async (id: number, arrived: boolean) => {
    await appointmentsApi.markClientArrived(id, arrived);
    await fetchAppointments();
  };

  const markVehicleArrived = async (id: number) => {
    await appointmentsApi.markVehicleArrived(id);
    await fetchAppointments();
  };

  const markVehiclePickedUp = async (id: number) => {
    await appointmentsApi.markVehiclePickedUp(id);
    await fetchAppointments();
  };

  return {
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
    markClientArrived,
    markVehicleArrived,
    markVehiclePickedUp,
    refetch: fetchAppointments,
  };
}

function getDateRange(date: Date, mode: CalendarViewMode): { start: Date; end: Date } {
  const d = new Date(date);
  switch (mode) {
    case "day": {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
      return { start, end };
    }
    case "week": {
      const dayOfWeek = d.getDay();
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7, 0, 0, 0);
      return { start, end };
    }
    case "month": {
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0);
      return { start, end };
    }
  }
}
