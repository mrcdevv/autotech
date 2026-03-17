import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
  BankAccountRequest,
  BankAccountResponse,
  BankResponse,
} from "@/types/payment";

export const bankAccountsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<BankAccountResponse[]>>("/bank-accounts"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<BankAccountResponse>>(`/bank-accounts/${id}`),

  create: (data: BankAccountRequest) =>
    apiClient.post<ApiResponse<BankAccountResponse>>("/bank-accounts", data),

  update: (id: number, data: BankAccountRequest) =>
    apiClient.put<ApiResponse<BankAccountResponse>>(
      `/bank-accounts/${id}`,
      data,
    ),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/bank-accounts/${id}`),

  getAllBanks: () =>
    apiClient.get<ApiResponse<BankResponse[]>>("/bank-accounts/banks"),
};
