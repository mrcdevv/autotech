import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type { ProductResponse, ProductRequest } from "@/types/catalog";

export const productsApi = {
  search: (query?: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<ProductResponse>>>("/products", {
      params: { query, page, size, sort: "name,asc" },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<ProductResponse>>(`/products/${id}`),

  create: (data: ProductRequest) =>
    apiClient.post<ApiResponse<ProductResponse>>("/products", data),

  update: (id: number, data: ProductRequest) =>
    apiClient.put<ApiResponse<ProductResponse>>(`/products/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/products/${id}`),
};
