import { useState, useEffect, useCallback } from "react";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardFinancieroResponse } from "@/features/dashboard/types";
import { downloadFile } from "@/utils/downloadFile";

export function useFinanciero(months: number = 6) {
  const [data, setData] = useState<DashboardFinancieroResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getFinanciero(months);
      setData(res.data.data);
    } catch {
      setError("Error al cargar los datos financieros");
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportToExcel = useCallback(async () => {
    try {
      const res = await dashboardApi.exportFinanciero(months);
      downloadFile(new Blob([res.data]), "dashboard_financiero.xlsx");
    } catch {
      setError("Error al exportar a Excel");
    }
  }, [months]);

  return { data, loading, error, refetch: fetchData, exportToExcel };
}
