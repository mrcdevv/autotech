import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  DashboardSummaryResponse,
  DashboardFinancieroResponse,
  DashboardProductividadResponse,
  DashboardConfigResponse,
  DashboardConfigRequest,
  DashboardReportsResponse,
  FaultCountResponse,
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

  getReports: (from: string, to: string) =>
    apiClient.get<ApiResponse<DashboardReportsResponse>>(
      `/dashboard/reports/summary?from=${from}&to=${to}`
    ),

  getReportFaults: (from: string, to: string, brandId?: number | null) => {
    const brandParam = brandId ? `&brandId=${brandId}` : "";
    return apiClient.get<ApiResponse<FaultCountResponse[]>>(
      `/dashboard/reports/faults?from=${from}&to=${to}${brandParam}`
    );
  },

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
