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
}

export interface MonthlyRevenueResponse {
  year: number;
  month: number;
  total: number;
}

export interface DebtAgingResponse {
  range: string;
  invoiceCount: number;
  totalAmount: number;
}

export interface UnpaidInvoiceResponse {
  invoiceId: number;
  clientFullName: string;
  vehiclePlate: string | null;
  total: number;
  createdAt: string;
}

export interface DashboardFinancieroResponse {
  monthlyRevenue: MonthlyRevenueResponse[];
  estimateConversionRate: number;
  estimatesAccepted: number;
  estimatesTotal: number;
  totalPendingBilling: number;
  debtAging: DebtAgingResponse[];
  topUnpaidInvoices: UnpaidInvoiceResponse[];
}

export interface MechanicProductivityResponse {
  employeeId: number;
  employeeFullName: string;
  completedOrders: number;
}

export interface TopServiceResponse {
  serviceName: string;
  count: number;
}

export interface DashboardProductividadResponse {
  averageRepairDays: number;
  mechanicProductivity: MechanicProductivityResponse[];
  topServices: TopServiceResponse[];
}

export interface DashboardConfigResponse {
  staleThresholdDays: number;
}

export interface DashboardConfigRequest {
  staleThresholdDays: number;
}
