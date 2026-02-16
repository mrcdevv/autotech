import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { BrandResponse, BrandRequest } from "@/types/vehicle";

export const brandsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<BrandResponse[]>>("/brands"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<BrandResponse>>(`/brands/${id}`),

  create: (data: BrandRequest) =>
    apiClient.post<ApiResponse<BrandResponse>>("/brands", data),

  update: (id: number, data: BrandRequest) =>
    apiClient.put<ApiResponse<BrandResponse>>(`/brands/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/brands/${id}`),
};
