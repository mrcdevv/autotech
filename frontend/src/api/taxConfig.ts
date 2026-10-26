import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { TaxConfigResponse } from "@/types/tax";

export const taxConfigApi = {
  getConfig: () =>
    apiClient.get<ApiResponse<TaxConfigResponse>>("/tax-config"),

  updateConfig: (data: { taxPercentage: number }) =>
    apiClient.put<ApiResponse<TaxConfigResponse>>("/tax-config", data),
};
