import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  DashboardSummaryResponse,
  DashboardConfigResponse,
  DashboardConfigRequest,
  DashboardReportsResponse,
  FaultCountResponse,
} from "@/features/dashboard/types";

export const dashboardApi = {
  getSummary: () =>
    apiClient.get<ApiResponse<DashboardSummaryResponse>>("/dashboard/summary"),

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

  exportReports: (from: string, to: string) =>
    apiClient.get<Blob>(`/dashboard/reports/export?from=${from}&to=${to}`, {
      responseType: "blob",
    }),

  getConfig: () =>
    apiClient.get<ApiResponse<DashboardConfigResponse>>("/dashboard/config"),

  updateConfig: (data: DashboardConfigRequest) =>
    apiClient.put<ApiResponse<DashboardConfigResponse>>(
      "/dashboard/config",
      data
    ),
};
