import { useState, useEffect, useCallback } from "react";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardSummaryResponse } from "@/features/dashboard/types";

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getSummary();
      setSummary(res.data.data);
    } catch {
      setError("Error al cargar el resumen del dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { summary, loading, error, refetch: fetchData };
}
