import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { PermissionResponse } from "@/types/role";

export const permissionsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<PermissionResponse[]>>("/permissions"),
};
