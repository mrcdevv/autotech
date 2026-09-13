import apiClient from "@/api/client";
import type { ChangePasswordRequest, LoginRequest, LoginResponse } from "../types";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put<{ status: string; message: string }>("/auth/change-password", data),
};
