import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { TagResponse } from "@/types/appointment";

export const tagsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<TagResponse[]>>("/tags"),
};
