import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  DashboardSummaryResponse,
  DashboardFinancieroResponse,
  DashboardProductividadResponse,
  DashboardConfigResponse,
  DashboardConfigRequest,
} from "@/features/dashboard/types";

export const dashboardApi = {
  getSummary: () =>
    apiClient.get<ApiResponse<DashboardSummaryResponse>>("/dashboard/summary"),

  getFinanciero: (months: number = 6) =>
    apiClient.get<ApiResponse<DashboardFinancieroResponse>>(
      `/dashboard/financiero?months=${months}`
    ),

  getProductividad: () =>
    apiClient.get<ApiResponse<DashboardProductividadResponse>>(
      "/dashboard/productividad"
    ),

  getConfig: () =>
    apiClient.get<ApiResponse<DashboardConfigResponse>>("/dashboard/config"),

  updateConfig: (data: DashboardConfigRequest) =>
    apiClient.put<ApiResponse<DashboardConfigResponse>>(
      "/dashboard/config",
      data
    ),

  exportFinanciero: (months: number = 6) =>
    apiClient.get<Blob>(`/dashboard/export/financiero?months=${months}`, {
      responseType: "blob",
    }),

  exportProductividad: () =>
    apiClient.get<Blob>("/dashboard/export/productividad", {
      responseType: "blob",
    }),
};
