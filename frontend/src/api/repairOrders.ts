import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
  RepairOrderResponse,
  RepairOrderDetailResponse,
  RepairOrderRequest,
  StatusUpdateRequest,
  TitleUpdateRequest,
  RepairOrderStatus,
} from "@/features/repair-orders/types";
import type { NotesUpdateRequest } from "@/features/inspections/types";

export const repairOrdersApi = {
  getAll: () =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<RepairOrderDetailResponse>>(`/repair-orders/${id}`),

  create: (data: RepairOrderRequest) =>
    apiClient.post<ApiResponse<RepairOrderResponse>>("/repair-orders", data),

  update: (id: number, data: RepairOrderRequest) =>
    apiClient.put<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/repair-orders/${id}`),

  updateStatus: (id: number, data: StatusUpdateRequest) =>
    apiClient.patch<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/status`, data),

  updateTitle: (id: number, data: TitleUpdateRequest) =>
    apiClient.patch<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/title`, data),

  getByStatus: (statuses: RepairOrderStatus[]) =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders/by-status", {
      params: { statuses: statuses.join(",") },
    }),

  assignEmployees: (id: number, employeeIds: number[]) =>
    apiClient.put<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/employees`, employeeIds),

  assignTags: (id: number, tagIds: number[]) =>
    apiClient.put<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/tags`, tagIds),

  search: (query: string) =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders/search", {
      params: { query },
    }),

  filterByEmployee: (employeeId: number) =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders/filter/by-employee", {
      params: { employeeId },
    }),

  filterByTag: (tagId: number) =>
    apiClient.get<ApiResponse<RepairOrderResponse[]>>("/repair-orders/filter/by-tag", {
      params: { tagId },
    }),

  updateNotes: (id: number, data: NotesUpdateRequest) =>
    apiClient.patch<ApiResponse<RepairOrderDetailResponse>>(`/repair-orders/${id}/notes`, data),
};
