import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentSummaryResponse,
} from "@/types/payment";

export const paymentsApi = {
  getByInvoice: (invoiceId: number) =>
    apiClient.get<ApiResponse<PaymentResponse[]>>(
      `/invoices/${invoiceId}/payments`,
    ),

  getSummary: (invoiceId: number) =>
    apiClient.get<ApiResponse<PaymentSummaryResponse>>(
      `/invoices/${invoiceId}/payments/summary`,
    ),

  create: (invoiceId: number, data: PaymentRequest) =>
    apiClient.post<ApiResponse<PaymentResponse>>(
      `/invoices/${invoiceId}/payments`,
      data,
    ),

  update: (invoiceId: number, paymentId: number, data: PaymentRequest) =>
    apiClient.put<ApiResponse<PaymentResponse>>(
      `/invoices/${invoiceId}/payments/${paymentId}`,
      data,
    ),

  delete: (invoiceId: number, paymentId: number, performedBy: number) =>
    apiClient.delete<ApiResponse<void>>(
      `/invoices/${invoiceId}/payments/${paymentId}`,
      { params: { performedBy } },
    ),
};
