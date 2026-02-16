import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  InvoiceResponse,
  InvoiceDetailResponse,
  InvoiceRequest,
  InvoiceStatus,
} from "@/types/invoice";

export const invoicesApi = {
  getAll: (params: {
    clientName?: string;
    plate?: string;
    status?: InvoiceStatus;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    apiClient.get<ApiResponse<PageResponse<InvoiceResponse>>>("/invoices", {
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
    apiClient.get<ApiResponse<InvoiceDetailResponse>>(`/invoices/${id}`),

  getByRepairOrderId: (repairOrderId: number) =>
    apiClient.get<ApiResponse<InvoiceDetailResponse>>(
      `/repair-orders/${repairOrderId}/invoice`,
    ),

  create: (data: InvoiceRequest) =>
    apiClient.post<ApiResponse<InvoiceDetailResponse>>("/invoices", data),

  createFromEstimate: (estimateId: number) =>
    apiClient.post<ApiResponse<InvoiceDetailResponse>>(
      `/invoices/from-estimate/${estimateId}`,
    ),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/invoices/${id}`),
};
