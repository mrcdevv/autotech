export type VehicleDeliveryMethod = "PROPIO" | "GRUA" | "TERCERO";

export type AppointmentStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export type AppointmentConfirmationStatus = "PENDING" | "CONFIRMED" | "DECLINED";

export type CalendarViewMode = "day" | "week" | "month";

export interface AppointmentResponse {
  id: number;
  title: string | null;
  clientId: number | null;
  clientFullName: string | null;
  clientEmail: string | null;
  vehicleId: number | null;
  vehiclePlate: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  purpose: string | null;
  startTime: string;
  endTime: string;
  vehicleDeliveryMethod: VehicleDeliveryMethod | null;
  status: AppointmentStatus;
  vehicleArrivedAt: string | null;
  vehiclePickedUpAt: string | null;
  clientArrived: boolean;
  confirmationStatus: AppointmentConfirmationStatus;
  confirmedAt: string | null;
  employees: EmployeeSummaryResponse[];
  tags: TagResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRequest {
  title: string | null;
  clientId: number | null;
  vehicleId: number | null;
  purpose: string | null;
  startTime: string;
  endTime: string;
  vehicleDeliveryMethod: VehicleDeliveryMethod | null;
  employeeIds: number[];
  tagIds: number[];
  notifyClient: boolean;
}

export interface AppointmentUpdateRequest {
  startTime: string;
  endTime: string;
  notifyClient?: boolean;
}

export interface PublicAppointmentResponse {
  clientFirstName: string | null;
  vehicleDescription: string | null;
  purpose: string | null;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  confirmationStatus: AppointmentConfirmationStatus;
  canRespond: boolean;
}

export interface EmployeeSummaryResponse {
  id: number;
  firstName: string;
  lastName: string;
}

export interface TagResponse {
  id: number;
  name: string;
  color: string | null;
}

export interface CalendarConfigResponse {
  id: number;
  defaultAppointmentDurationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarConfigRequest {
  defaultAppointmentDurationMinutes: number;
  startTime: string | null;
  endTime: string | null;
}
