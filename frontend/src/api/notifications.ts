import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
  NotificationConfigRequest,
  NotificationConfigResponse,
  ReminderRunResponse,
} from "@/types/notification";

export const notificationsApi = {
  getConfig: () =>
    apiClient.get<ApiResponse<NotificationConfigResponse>>("/notifications/config"),

  updateConfig: (data: NotificationConfigRequest) =>
    apiClient.put<ApiResponse<NotificationConfigResponse>>("/notifications/config", data),

  runReminders: () =>
    apiClient.post<ApiResponse<ReminderRunResponse>>("/notifications/reminders/run"),

  sendTestEmail: (to: string) =>
    apiClient.post<ApiResponse<void>>("/notifications/test-email", { to }),
};
