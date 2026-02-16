import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type { CatalogServiceResponse, CatalogServiceRequest } from "@/types/catalog";

export const catalogServicesApi = {
  search: (query?: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<CatalogServiceResponse>>>("/services", {
      params: { query, page, size, sort: "name,asc" },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<CatalogServiceResponse>>(`/services/${id}`),

  create: (data: CatalogServiceRequest) =>
    apiClient.post<ApiResponse<CatalogServiceResponse>>("/services", data),

  update: (id: number, data: CatalogServiceRequest) =>
    apiClient.put<ApiResponse<CatalogServiceResponse>>(`/services/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/services/${id}`),
};
