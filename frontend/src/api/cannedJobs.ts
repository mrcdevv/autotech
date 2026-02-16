import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  CannedJobResponse,
  CannedJobDetailResponse,
  CannedJobRequest,
} from "@/types/catalog";

export const cannedJobsApi = {
  search: (query?: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<CannedJobResponse>>>("/canned-jobs", {
      params: { query, page, size, sort: "title,asc" },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<CannedJobDetailResponse>>(`/canned-jobs/${id}`),

  create: (data: CannedJobRequest) =>
    apiClient.post<ApiResponse<CannedJobDetailResponse>>("/canned-jobs", data),

  update: (id: number, data: CannedJobRequest) =>
    apiClient.put<ApiResponse<CannedJobDetailResponse>>(`/canned-jobs/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/canned-jobs/${id}`),
};
