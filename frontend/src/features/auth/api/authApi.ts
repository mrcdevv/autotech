import apiClient from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  ChangePasswordRequest,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
} from "../types";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  me: () => apiClient.get<ApiResponse<CurrentUserResponse>>("/auth/me"),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put<{ status: string; message: string }>("/auth/change-password", data),

  requestPasswordRecovery: (email: string) =>
    apiClient.post<ApiResponse<void>>("/auth/password-recovery", { email }),

  resetPassword: (data: PasswordResetRequest) =>
    apiClient.post<ApiResponse<void>>("/auth/password-reset", data),
};
