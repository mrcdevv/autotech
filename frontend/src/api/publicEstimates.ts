import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { PublicEstimateResponse } from "@/types/estimate";

export const publicEstimatesApi = {
  getByToken: (token: string) =>
    apiClient.get<ApiResponse<PublicEstimateResponse>>(`/public/estimates/${encodeURIComponent(token)}`),

  approve: (token: string) =>
    apiClient.post<ApiResponse<PublicEstimateResponse>>(`/public/estimates/${encodeURIComponent(token)}/approve`),

  reject: (token: string) =>
    apiClient.post<ApiResponse<PublicEstimateResponse>>(`/public/estimates/${encodeURIComponent(token)}/reject`),
};
