import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  EstimateResponse,
  EstimateDetailResponse,
  EstimateRequest,
  EstimateInvoiceDataResponse,
  EstimateStatus,
} from "@/types/estimate";

export const estimatesApi = {
  getAll: (params: {
    clientName?: string;
    plate?: string;
    status?: EstimateStatus;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    apiClient.get<ApiResponse<PageResponse<EstimateResponse>>>("/estimates", {
      params: {
        clientName: params.clientName,
        plate: params.plate,
        status: params.status,
        page: params.page ?? 0,
        size: params.size ?? 12,
        sort: params.sort ?? "createdAt,desc",
      },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<EstimateDetailResponse>>(`/estimates/${id}`),

  getByRepairOrderId: (repairOrderId: number) =>
    apiClient.get<ApiResponse<EstimateDetailResponse>>(
      `/repair-orders/${repairOrderId}/estimate`,
    ),

  create: (data: EstimateRequest) =>
    apiClient.post<ApiResponse<EstimateDetailResponse>>("/estimates", data),

  update: (id: number, data: EstimateRequest) =>
    apiClient.put<ApiResponse<EstimateDetailResponse>>(`/estimates/${id}`, data),

  approve: (id: number) =>
    apiClient.put<ApiResponse<EstimateDetailResponse>>(`/estimates/${id}/approve`),

  reject: (id: number) =>
    apiClient.put<ApiResponse<EstimateDetailResponse>>(`/estimates/${id}/reject`),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/estimates/${id}`),

  getInvoiceData: (id: number) =>
    apiClient.get<ApiResponse<EstimateInvoiceDataResponse>>(
      `/estimates/${id}/invoice-data`,
    ),
};
