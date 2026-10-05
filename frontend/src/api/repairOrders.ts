import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  RepairOrderResponse,
  RepairOrderDetailResponse,
  RepairOrderRequest,
  StatusUpdateRequest,
  TitleUpdateRequest,
  RepairOrderStatus,
} from "@/features/repair-orders/types";
import type { NotesUpdateRequest } from "@/features/inspections/types";

export interface RepairOrderListParams {
  statuses?: RepairOrderStatus[];
  from?: string;
  to?: string;
  employeeId?: number;
  tagId?: number;
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const repairOrdersApi = {
  search: (params: RepairOrderListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<RepairOrderResponse>>>("/repair-orders", {
      params: {
        ...(params.statuses && params.statuses.length > 0
          ? { statuses: params.statuses.join(",") }
          : {}),
        ...(params.from ? { from: params.from } : {}),
        ...(params.to ? { to: params.to } : {}),
        ...(params.employeeId != null ? { employeeId: params.employeeId } : {}),
        ...(params.tagId != null ? { tagId: params.tagId } : {}),
        ...(params.q ? { q: params.q } : {}),
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? "createdAt,desc",
      },
    }),

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

  assignEmployees: (id: number, employeeIds: number[]) =>
    apiClient.put<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/employees`, employeeIds),

  assignTags: (id: number, tagIds: number[]) =>
    apiClient.put<ApiResponse<RepairOrderResponse>>(`/repair-orders/${id}/tags`, tagIds),

  updateNotes: (id: number, data: NotesUpdateRequest) =>
    apiClient.patch<ApiResponse<RepairOrderDetailResponse>>(`/repair-orders/${id}/notes`, data),
};
