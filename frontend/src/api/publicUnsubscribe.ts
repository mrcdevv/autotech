import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { PublicUnsubscribeResponse } from "@/types/notification";

export const publicUnsubscribeApi = {
  getByToken: (token: string) =>
    apiClient.get<ApiResponse<PublicUnsubscribeResponse>>(`/public/unsubscribe/${encodeURIComponent(token)}`),

  unsubscribe: (token: string) =>
    apiClient.post<ApiResponse<PublicUnsubscribeResponse>>(`/public/unsubscribe/${encodeURIComponent(token)}`),
};
