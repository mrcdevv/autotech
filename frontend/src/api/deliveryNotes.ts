import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  DeliveryNoteResponse,
  DeliveryNoteDetailResponse,
  DeliveryNoteRequest,
  DeliveryNoteStatus,
} from "@/types/deliveryNote";

export const deliveryNotesApi = {
  getAll: (params: {
    clientName?: string;
    plate?: string;
    status?: DeliveryNoteStatus;
    /** Identity filter: exact client match. Preferred over clientName to avoid homonym omissions. */
    clientId?: number;
    /** Identity filter: exact vehicle match. Note it excludes remitos with no vehicle. */
    vehicleId?: number;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    apiClient.get<ApiResponse<PageResponse<DeliveryNoteResponse>>>("/delivery-notes", {
      params: {
        clientName: params.clientName,
        plate: params.plate,
        status: params.status,
        clientId: params.clientId,
        vehicleId: params.vehicleId,
        page: params.page ?? 0,
        size: params.size ?? 12,
        sort: params.sort ?? "createdAt,desc",
      },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<DeliveryNoteDetailResponse>>(`/delivery-notes/${id}`),

  getByRepairOrderId: (repairOrderId: number) =>
    apiClient.get<ApiResponse<DeliveryNoteDetailResponse>>(
      `/repair-orders/${repairOrderId}/delivery-note`,
    ),

  create: (data: DeliveryNoteRequest) =>
    apiClient.post<ApiResponse<DeliveryNoteDetailResponse>>("/delivery-notes", data),

  createFromEstimate: (estimateId: number) =>
    apiClient.post<ApiResponse<DeliveryNoteDetailResponse>>(
      `/delivery-notes/from-estimate/${estimateId}`,
    ),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/delivery-notes/${id}`),

  /** Attaches an existing standalone remito to a repair order. */
  attachToRepairOrder: (id: number, repairOrderId: number) =>
    apiClient.put<ApiResponse<DeliveryNoteDetailResponse>>(
      `/delivery-notes/${id}/repair-order`,
      { repairOrderId },
    ),

  downloadPdf: (id: number) =>
    apiClient.get<Blob>(`/delivery-notes/${id}/pdf`, { responseType: "blob" }),
};
