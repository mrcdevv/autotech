import apiClient from "./client";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { Client, ClientRequest, ClientUpgradeRequest } from "@/features/clients/types/client";

export const clientsApi = {
    getAll: (page = 0, size = 12, sort = "createdAt,desc") =>
        apiClient.get<ApiResponse<PageResponse<Client>>>("/clients", {
            params: { page, size, sort },
        }),

    getById: (id: number) =>
        apiClient.get<ApiResponse<Client>>(`/clients/${id}`),

    create: (data: ClientRequest) =>
        apiClient.post<ApiResponse<Client>>("/clients", data),

    update: (id: number, data: ClientRequest) =>
        apiClient.put<ApiResponse<Client>>(`/clients/${id}`, data),

    delete: (id: number) =>
        apiClient.delete<ApiResponse<void>>(`/clients/${id}`),

    findByDni: (dni: string) =>
        apiClient.get<ApiResponse<Client>>(`/clients/dni/${dni}`),

    search: (query: string, page = 0, size = 12) =>
        apiClient.get<ApiResponse<PageResponse<Client>>>("/clients/search", {
            params: { query, page, size },
        }),

    findByType: (clientType: string, page = 0, size = 12) =>
        apiClient.get<ApiResponse<PageResponse<Client>>>("/clients/by-type", {
            params: { clientType, page, size },
        }),

    upgrade: (id: number, data: ClientUpgradeRequest) =>
        apiClient.patch<ApiResponse<Client>>(`/clients/${id}/upgrade`, data),

    exportToExcel: () =>
        apiClient.get<Blob>("/clients/export", { responseType: "blob" }),
};
