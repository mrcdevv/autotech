import apiClient from "./client";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { VehicleResponse, VehicleRequest } from "@/types/vehicle";

export const vehiclesApi = {
  getAll: (page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<VehicleResponse>>>("/vehicles", {
      params: { page, size },
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<VehicleResponse>>(`/vehicles/${id}`),

  create: (data: VehicleRequest) =>
    apiClient.post<ApiResponse<VehicleResponse>>("/vehicles", data),

  update: (id: number, data: VehicleRequest) =>
    apiClient.put<ApiResponse<VehicleResponse>>(`/vehicles/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/vehicles/${id}`),

  searchByPlate: (plate: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<VehicleResponse>>>("/vehicles/search", {
      params: { plate, page, size },
    }),

  getByClient: (clientId: number) =>
    apiClient.get<ApiResponse<VehicleResponse[]>>(`/vehicles/by-client/${clientId}`),

  filterByBrand: (brandId: number, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<VehicleResponse>>>("/vehicles/filter/by-brand", {
      params: { brandId, page, size },
    }),

  filterByYear: (year: number, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<VehicleResponse>>>("/vehicles/filter/by-year", {
      params: { year, page, size },
    }),

  filterByModel: (model: string, page = 0, size = 12) =>
    apiClient.get<ApiResponse<PageResponse<VehicleResponse>>>("/vehicles/filter/by-model", {
      params: { model, page, size },
    }),
};
