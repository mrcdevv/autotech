import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { PublicAppointmentResponse } from "@/types/appointment";

export const publicAppointmentsApi = {
  getByToken: (token: string) =>
    apiClient.get<ApiResponse<PublicAppointmentResponse>>(`/public/appointments/${encodeURIComponent(token)}`),

  confirm: (token: string) =>
    apiClient.post<ApiResponse<PublicAppointmentResponse>>(`/public/appointments/${encodeURIComponent(token)}/confirm`),

  decline: (token: string) =>
    apiClient.post<ApiResponse<PublicAppointmentResponse>>(`/public/appointments/${encodeURIComponent(token)}/decline`),
};
