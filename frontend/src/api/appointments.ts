import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  AppointmentResponse,
  AppointmentRequest,
  AppointmentUpdateRequest,
} from "@/types/appointment";

export const appointmentsApi = {
  getAll: (page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>("/appointments", {
      params: { page, size, sort: "startTime,asc" },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<AppointmentResponse>>(`/appointments/${id}`),

  create: (data: AppointmentRequest) =>
    apiClient.post<ApiResponse<AppointmentResponse>>("/appointments", data),

  update: (id: number, data: AppointmentUpdateRequest) =>
    apiClient.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/appointments/${id}`),

  markClientArrived: (id: number, arrived: boolean) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/client-arrived`,
      null,
      { params: { arrived } },
    ),

  markVehicleArrived: (id: number) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/vehicle-arrived`,
    ),

  markVehiclePickedUp: (id: number) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/vehicle-picked-up`,
    ),

  getByDateRange: (start: string, end: string, employeeId?: number) =>
    apiClient.get<ApiResponse<AppointmentResponse[]>>("/appointments/range", {
      params: { start, end, ...(employeeId ? { employeeId } : {}) },
    }),
};
