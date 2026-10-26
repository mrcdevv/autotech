import apiClient from "./client";

import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  ProductResponse,
  ProductRequest,
  StockAdjustmentRequest,
  StockMovementResponse,
} from "@/types/catalog";

export const productsApi = {
  search: (query?: string, page = 0, size = 12, lowStock = false) =>
    apiClient.get<ApiResponse<PageResponse<ProductResponse>>>("/products", {
      params: { query, page, size, sort: "name,asc", ...(lowStock ? { lowStock: true } : {}) },
    }),

  getLowStock: () =>
    apiClient.get<ApiResponse<ProductResponse[]>>("/products/low-stock"),

  adjustStock: (id: number, data: StockAdjustmentRequest) =>
    apiClient.post<ApiResponse<ProductResponse>>(`/products/${id}/stock-adjustments`, data),

  getStockMovements: (id: number, page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<StockMovementResponse>>>(`/products/${id}/stock-movements`, {
      params: { page, size },
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
