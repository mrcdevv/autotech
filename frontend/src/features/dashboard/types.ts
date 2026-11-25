export interface StatusCountResponse {
  status: string;
  count: number;
}

export interface TodayAppointmentResponse {
  appointmentId: number;
  startTime: string;
  clientFullName: string | null;
  vehiclePlate: string | null;
  purpose: string | null;
}

export interface StaleOrderAlertResponse {
  repairOrderId: number;
  title: string | null;
  clientFullName: string;
  vehiclePlate: string;
  status: string;
  daysSinceLastUpdate: number;
}

export interface PendingEstimateAlertResponse {
  estimateId: number;
  clientFullName: string;
  vehiclePlate: string;
  total: number;
  daysPending: number;
}

export interface LowStockAlertResponse {
  productId: number;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  /** quantity - reservedQuantity, below minStock */
  availableQuantity: number;
  minStock: number;
}

export interface ReadyForPickupResponse {
  repairOrderId: number;
  title: string | null;
  clientFullName: string;
  clientPhone: string;
  vehiclePlate: string;
}

export interface DashboardSummaryResponse {
  openRepairOrderCount: number;
  readyForPickupCount: number;
  todayAppointmentCount: number;
  pendingEstimateCount: number;
  repairOrderStatusCounts: StatusCountResponse[];
  todayAppointments: TodayAppointmentResponse[];
  readyForPickupOrders: ReadyForPickupResponse[];
  staleOrderAlerts: StaleOrderAlertResponse[];
  pendingEstimateAlerts: PendingEstimateAlertResponse[];
  staleThresholdDays: number;
  lowStockAlerts: LowStockAlertResponse[];
}

export interface ReportKpisResponse {
  totalBilled: number;
  /** Total of the delivery notes marked as paid. */
  totalCollected: number;
  totalPending: number;
  deliveryNoteCount: number;
  pendingDeliveryNoteCount: number;
  averageTicket: number;
  estimatesTotal: number;
  estimatesAccepted: number;
  repairOrderCount: number;
}

export interface MonthlyBillingResponse {
  year: number;
  month: number;
  billed: number;
  collected: number;
}

export interface ServiceStatsResponse {
  serviceName: string;
  count: number;
  totalRevenue: number;
}

export interface DebtAgingResponse {
  range: string;
  deliveryNoteCount: number;
  totalAmount: number;
}

export interface UnpaidDeliveryNoteResponse {
  deliveryNoteId: number;
  clientFullName: string;
  vehiclePlate: string | null;
  total: number;
  createdAt: string;
}

export interface MechanicProductivityResponse {
  employeeId: number;
  employeeFullName: string;
  completedOrders: number;
}

export interface BrandCountResponse {
  brandName: string;
  count: number;
}

export interface FaultCountResponse {
  faultName: string;
  count: number;
}

/** debtAging and unpaidDeliveryNotes are the debt as of today, regardless of the period. */
export interface DashboardReportsResponse {
  kpis: ReportKpisResponse;
  monthlyBilling: MonthlyBillingResponse[];
  services: ServiceStatsResponse[];
  brandCounts: BrandCountResponse[];
  debtAging: DebtAgingResponse[];
  unpaidDeliveryNotes: UnpaidDeliveryNoteResponse[];
  mechanicProductivity: MechanicProductivityResponse[];
  averageRepairDays: number;
}

export interface DashboardConfigResponse {
  staleThresholdDays: number;
}

export interface DashboardConfigRequest {
  staleThresholdDays: number;
}
