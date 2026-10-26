export interface NotificationConfigResponse {
  remindersEnabled: boolean;
  appointmentReminderEnabled: boolean;
  serviceReminderEnabled: boolean;
  serviceReminderMonths: number;
  balanceDueEnabled: boolean;
  balanceDueDays: number;
  pickupReminderEnabled: boolean;
  pickupReminderDays: number;
  mailEnabled: boolean;
  remindersCron: string;
}

export type NotificationConfigRequest = Omit<NotificationConfigResponse, "mailEnabled" | "remindersCron">;

export interface ReminderRunResponse {
  appointmentReminders: number;
  serviceReminders: number;
  balanceDueReminders: number;
  pickupReminders: number;
}

export interface PublicUnsubscribeResponse {
  clientFirstName: string;
  optedOut: boolean;
}
