import type { RepairOrderResponse } from "@/features/repair-orders/types";
import type { AppointmentResponse } from "@/types/appointment";
import type { InvoiceResponse } from "@/types/invoice";
import type { DashboardSummaryResponse } from "@/features/dashboard/types";
import type { StatusTone } from "@/theme/tokens";

import { STATUS_META } from "@/features/repair-orders/statusMeta";
import { dot } from "@/theme/tokens";
import { formatCurrencyWhole } from "@/utils/formatCurrency";
import { initials } from "@/utils/initials";

export const WORKSHOP_BAY_CAPACITY = 6;
export const WORK_QUEUE_LIMIT = 5;
export const UPCOMING_APPOINTMENTS_LIMIT = 4;

export interface KpiView {
  label: string;
  value: string;
  hint: string;
  valueColor: string;
}

export interface WorkshopCarouselItem {
  id: number;
  position: number;
  puesto: string;
  ot: string;
  plate: string;
  vehicle: string;
  client: string;
  task: string;
  statusLabel: string;
  tone: StatusTone;
  color: string;
  progress: number;
  mechanic: string;
  initials: string;
}

export interface QueueItemView {
  ot: string;
  client: string;
  vehicle: string;
  task: string;
  status: string;
  color: string;
}

export interface AppointmentView {
  time: string;
  client: string;
  detail: string;
}

export interface DailyCashView {
  total: string;
  paidCount: number;
  pendingCount: number;
  pendingTotal: string;
  paidRatio: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return time;

  const weekday = date
    .toLocaleDateString("es-AR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  return `${weekday} ${time}`;
}

function vehicleLabel(order: RepairOrderResponse, withYear = false): string {
  const parts = [order.vehicleBrandName, order.vehicleModel].filter(Boolean);
  const base = parts.join(" ") || "Vehículo";
  return withYear && order.vehicleYear ? `${base} ${order.vehicleYear}` : base;
}

function clientLabel(order: RepairOrderResponse): string {
  return `${order.clientFirstName} ${order.clientLastName}`.trim();
}

function openOrders(orders: RepairOrderResponse[]): RepairOrderResponse[] {
  return orders
    .filter((order) => order.status !== "ENTREGADO" && order.status !== "CANCELADO")
    .sort((a, b) => {
      const priorityDiff = STATUS_META[a.status].priority - STATUS_META[b.status].priority;
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

function isCreatedToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function buildKpis(
  summary: DashboardSummaryResponse,
  orders: RepairOrderResponse[],
  appointments: AppointmentResponse[]
): KpiView[] {
  const createdToday = orders.filter((order) => isCreatedToday(order.createdAt)).length;

  const readyOrder = summary.readyForPickupOrders[0];
  const readyHint = readyOrder
    ? `${readyOrder.clientFullName} · ${readyOrder.vehiclePlate}`
    : "Sin vehículos listos";

  const nextAppointment = appointments
    .filter((appointment) => new Date(appointment.startTime).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  const appointmentHint = nextAppointment
    ? `La próxima es a las ${formatTime(nextAppointment.startTime)}`
    : "Sin citas para hoy";

  const pendingTotal = summary.pendingEstimateAlerts.reduce((sum, alert) => sum + alert.total, 0);

  return [
    {
      label: "Vehículos en taller",
      value: pad(summary.openRepairOrderCount),
      hint: `${createdToday} ingresaron hoy`,
      valueColor: "text.primary",
    },
    {
      label: "Listos para entregar",
      value: pad(summary.readyForPickupCount),
      hint: readyHint,
      valueColor: dot.ok,
    },
    {
      label: "Citas de hoy",
      value: pad(summary.todayAppointmentCount),
      hint: appointmentHint,
      valueColor: "text.primary",
    },
    {
      label: "Presup. sin respuesta",
      value: pad(summary.pendingEstimateCount),
      hint: `${formatCurrencyWhole(pendingTotal)} esperando OK`,
      valueColor: dot.warn,
    },
  ];
}

export function buildWorkshopCarousel(
  orders: RepairOrderResponse[],
  capacity = WORKSHOP_BAY_CAPACITY
): WorkshopCarouselItem[] {
  return openOrders(orders).map((order, index) => {
    const meta = STATUS_META[order.status];
    const employee = order.employees[0];

    return {
      id: order.id,
      position: index + 1,
      puesto: index < capacity ? `Puesto ${index + 1}` : "Sin puesto",
      ot: `OT-${order.id}`,
      plate: order.vehiclePlate,
      vehicle: vehicleLabel(order, true),
      client: clientLabel(order),
      task: order.title ?? meta.label,
      statusLabel: meta.label,
      tone: meta.tone,
      color: meta.color,
      progress: meta.progress,
      mechanic: employee ? `${employee.firstName} ${employee.lastName}` : "Sin asignar",
      initials: employee ? initials(employee.firstName, employee.lastName) : "—",
    };
  });
}

export function buildWorkQueue(
  orders: RepairOrderResponse[],
  limit = WORK_QUEUE_LIMIT
): QueueItemView[] {
  return openOrders(orders)
    .slice(0, limit)
    .map((order) => ({
      ot: `OT-${order.id}`,
      client: clientLabel(order),
      vehicle: vehicleLabel(order, true),
      task: order.title ?? STATUS_META[order.status].label,
      status: STATUS_META[order.status].label,
      color: STATUS_META[order.status].color,
    }));
}

export function buildUpcomingAppointments(
  appointments: AppointmentResponse[],
  limit = UPCOMING_APPOINTMENTS_LIMIT
): AppointmentView[] {
  return appointments
    .filter((appointment) => appointment.status !== "CANCELLED")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, limit)
    .map((appointment) => {
      const parts = [appointment.vehicleBrand, appointment.vehicleModel].filter(Boolean).join(" ");
      const detail = [parts || null, appointment.vehiclePlate].filter(Boolean).join(" · ");

      return {
        time: formatTime(appointment.startTime),
        client: appointment.clientFullName ?? "Sin cliente",
        detail: detail || appointment.purpose || "Sin detalle",
      };
    });
}

export function buildDailyCash(invoices: InvoiceResponse[]): DailyCashView {
  const today = invoices.filter((invoice) => isCreatedToday(invoice.createdAt));

  const paid = today.filter((invoice) => invoice.status === "PAGADA");
  const pending = today.filter((invoice) => invoice.status === "PENDIENTE");

  const paidTotal = paid.reduce((sum, invoice) => sum + (invoice.total ?? 0), 0);
  const pendingTotal = pending.reduce((sum, invoice) => sum + (invoice.total ?? 0), 0);
  const grandTotal = paidTotal + pendingTotal;

  return {
    total: formatCurrencyWhole(paidTotal),
    paidCount: paid.length,
    pendingCount: pending.length,
    pendingTotal: formatCurrencyWhole(pendingTotal),
    paidRatio: grandTotal > 0 ? (paidTotal / grandTotal) * 100 : 0,
  };
}
