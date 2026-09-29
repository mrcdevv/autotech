import { useState, useEffect, useCallback } from "react";

import { dashboardApi } from "@/api/dashboard";

import type { DashboardReportsResponse } from "@/features/dashboard/types";

export function useReports(from: string, to: string) {
  const [data, setData] = useState<DashboardReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getReports(from, to);
      setData(res.data.data);
    } catch {
      setError("No se pudieron cargar los datos de este informe.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
