import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { RoleRequest, RoleResponse } from "@/types/role";

export const rolesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<RoleResponse[]>>("/roles"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<RoleResponse>>(`/roles/${id}`),

  create: (data: RoleRequest) =>
    apiClient.post<ApiResponse<RoleResponse>>("/roles", data),

  update: (id: number, data: RoleRequest) =>
    apiClient.put<ApiResponse<RoleResponse>>(`/roles/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/roles/${id}`),
};
