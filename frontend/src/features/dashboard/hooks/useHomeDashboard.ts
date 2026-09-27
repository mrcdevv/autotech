import { useCallback, useEffect, useState } from "react";

import { appointmentsApi } from "@/api/appointments";
import { dashboardApi } from "@/api/dashboard";
import { invoicesApi } from "@/api/invoices";
import { repairOrdersApi } from "@/api/repairOrders";
import type { DashboardSummaryResponse } from "@/features/dashboard/types";
import type { RepairOrderResponse } from "@/features/repair-orders/types";
import type { AppointmentResponse } from "@/types/appointment";
import type { InvoiceResponse } from "@/types/invoice";

const UPCOMING_DAYS = 7;
const INVOICE_PAGE_SIZE = 100;

function toLocalIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function useHomeDashboard() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [orders, setOrders] = useState<RepairOrderResponse[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + UPCOMING_DAYS);

      const [summaryRes, ordersRes, appointmentsRes, invoicesRes] = await Promise.all([
        dashboardApi.getSummary(),
        repairOrdersApi.getAll(),
        appointmentsApi.getByDateRange(toLocalIso(rangeStart), toLocalIso(rangeEnd)),
        invoicesApi.getAll({ size: INVOICE_PAGE_SIZE, sort: "createdAt,desc" }),
      ]);

      setSummary(summaryRes.data.data);
      setOrders(ordersRes.data.data);
      setAppointments(appointmentsRes.data.data);
      setInvoices(invoicesRes.data.data.content);
    } catch {
      setError("Error al cargar el inicio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { summary, orders, appointments, invoices, loading, error, refetch: fetchData };
}
