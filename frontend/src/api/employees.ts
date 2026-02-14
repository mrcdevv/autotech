import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type { EmployeeResponse, EmployeeRequest } from "@/features/employees/types";

export const employeesApi = {
  getAll: (page: number, size: number = 12) =>
    apiClient.get<ApiResponse<PageResponse<EmployeeResponse>>>("/employees", {
      params: { page, size },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<EmployeeResponse>>(`/employees/${id}`),

  create: (data: EmployeeRequest) =>
    apiClient.post<ApiResponse<EmployeeResponse>>("/employees", data),

  update: (id: number, data: EmployeeRequest) =>
    apiClient.put<ApiResponse<EmployeeResponse>>(`/employees/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/employees/${id}`),

  searchByDni: (dni: string, page: number, size: number = 12) =>
    apiClient.get<ApiResponse<PageResponse<EmployeeResponse>>>("/employees/search", {
      params: { dni, page, size },
    }),

  filterByStatus: (status: string, page: number, size: number = 12) =>
    apiClient.get<ApiResponse<PageResponse<EmployeeResponse>>>("/employees/filter/status", {
      params: { status, page, size },
    }),

  filterByRole: (roleId: number, page: number, size: number = 12) =>
    apiClient.get<ApiResponse<PageResponse<EmployeeResponse>>>("/employees/filter/role", {
      params: { roleId, page, size },
    }),

  assignRoles: (id: number, roleIds: number[]) =>
    apiClient.put<ApiResponse<EmployeeResponse>>(`/employees/${id}/roles`, roleIds),

  exportToExcel: () =>
    apiClient.get<Blob>("/employees/export/excel", {
      responseType: "blob",
    }),
};
