import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentSummaryResponse,
} from "@/types/payment";

export const paymentsApi = {
  getByDeliveryNote: (deliveryNoteId: number) =>
    apiClient.get<ApiResponse<PaymentResponse[]>>(
      `/delivery-notes/${deliveryNoteId}/payments`,
    ),

  getSummary: (deliveryNoteId: number) =>
    apiClient.get<ApiResponse<PaymentSummaryResponse>>(
      `/delivery-notes/${deliveryNoteId}/payments/summary`,
    ),

  create: (deliveryNoteId: number, data: PaymentRequest) =>
    apiClient.post<ApiResponse<PaymentResponse>>(
      `/delivery-notes/${deliveryNoteId}/payments`,
      data,
    ),

  update: (deliveryNoteId: number, paymentId: number, data: PaymentRequest) =>
    apiClient.put<ApiResponse<PaymentResponse>>(
      `/delivery-notes/${deliveryNoteId}/payments/${paymentId}`,
      data,
    ),

  delete: (deliveryNoteId: number, paymentId: number, performedBy: number) =>
    apiClient.delete<ApiResponse<void>>(
      `/delivery-notes/${deliveryNoteId}/payments/${paymentId}`,
      { params: { performedBy } },
    ),
};
