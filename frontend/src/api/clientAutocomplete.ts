import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { ClientAutocompleteResponse } from "@/types/vehicle";

export const clientAutocompleteApi = {
  search: (query?: string) =>
    apiClient.get<ApiResponse<ClientAutocompleteResponse[]>>("/clients/autocomplete", {
      params: query ? { query } : {},
    }),
};
