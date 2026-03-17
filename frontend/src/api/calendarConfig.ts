import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
  CalendarConfigResponse,
  CalendarConfigRequest,
} from "@/types/appointment";

export const calendarConfigApi = {
  getConfig: () =>
    apiClient.get<ApiResponse<CalendarConfigResponse>>("/calendar-config"),

  updateConfig: (data: CalendarConfigRequest) =>
    apiClient.put<ApiResponse<CalendarConfigResponse>>("/calendar-config", data),
};
