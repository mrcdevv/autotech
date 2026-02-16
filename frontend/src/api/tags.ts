import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { TagResponse } from "@/types/appointment";

export interface TagRequest {
  name: string;
  color: string | null;
}

export const tagsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<TagResponse[]>>("/tags"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<TagResponse>>(`/tags/${id}`),

  create: (data: TagRequest) =>
    apiClient.post<ApiResponse<TagResponse>>("/tags", data),

  update: (id: number, data: TagRequest) =>
    apiClient.put<ApiResponse<TagResponse>>(`/tags/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/tags/${id}`),
};
