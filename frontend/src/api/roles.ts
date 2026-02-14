import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { RoleResponse } from "@/types/role";

export const rolesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<RoleResponse[]>>("/roles"),
};
