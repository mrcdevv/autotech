export type RepairOrderStatus =
  | "INGRESO_VEHICULO"
  | "ESPERANDO_APROBACION_PRESUPUESTO"
  | "ESPERANDO_REPUESTOS"
  | "REPARACION"
  | "PRUEBAS"
  | "LISTO_PARA_ENTREGAR"
  | "ENTREGADO";

export const STATUS_LABELS: Record<RepairOrderStatus, string> = {
  INGRESO_VEHICULO: "Ingresó vehículo",
  ESPERANDO_APROBACION_PRESUPUESTO: "Esperando aprobación presupuesto",
  ESPERANDO_REPUESTOS: "Esperando repuestos",
  REPARACION: "Reparación",
  PRUEBAS: "Pruebas",
  LISTO_PARA_ENTREGAR: "Listo para entregar",
  ENTREGADO: "Entregado",
};

export const KANBAN_COLUMNS = [
  {
    title: "Presupuesto",
    statuses: ["INGRESO_VEHICULO", "ESPERANDO_APROBACION_PRESUPUESTO"] as RepairOrderStatus[],
  },
  {
    title: "Trabajo en proceso",
    statuses: ["ESPERANDO_REPUESTOS", "REPARACION", "PRUEBAS"] as RepairOrderStatus[],
  },
  {
    title: "Completada",
    statuses: ["LISTO_PARA_ENTREGAR", "ENTREGADO"] as RepairOrderStatus[],
  },
];

export const UPDATABLE_STATUSES: RepairOrderStatus[] = [
  "ESPERANDO_REPUESTOS",
  "REPARACION",
  "PRUEBAS",
  "LISTO_PARA_ENTREGAR",
  "ENTREGADO",
];

export interface EmployeeSummary {
  id: number;
  firstName: string;
  lastName: string;
}

export interface TagResponse {
  id: number;
  name: string;
  color: string | null;
}

export interface RepairOrderResponse {
  id: number;
  title: string | null;
  status: RepairOrderStatus;
  clientId: number;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrandName: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  employees: EmployeeSummary[];
  tags: TagResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkHistoryEntry {
  repairOrderId: number;
  repairOrderTitle: string | null;
  reason: string | null;
  createdAt: string;
}

export interface RepairOrderDetailResponse {
  id: number;
  title: string | null;
  status: RepairOrderStatus;
  reason: string | null;
  clientSource: string | null;
  mechanicNotes: string | null;
  appointmentId: number | null;
  clientId: number;
  clientFirstName: string;
  clientLastName: string;
  clientDni: string | null;
  clientPhone: string;
  clientEmail: string | null;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrandName: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleChassisNumber: string | null;
  employees: EmployeeSummary[];
  tags: TagResponse[];
  workHistory: WorkHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RepairOrderRequest {
  clientId: number;
  vehicleId: number;
  appointmentId?: number | null;
  reason?: string | null;
  clientSource?: string | null;
  employeeIds?: number[];
  tagIds?: number[];
}

export interface StatusUpdateRequest {
  newStatus: RepairOrderStatus;
}

export interface TitleUpdateRequest {
  title: string;
}
