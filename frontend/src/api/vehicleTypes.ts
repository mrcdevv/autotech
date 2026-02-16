import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { VehicleTypeResponse } from "@/types/vehicle";

export const vehicleTypesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<VehicleTypeResponse[]>>("/vehicle-types"),
};
