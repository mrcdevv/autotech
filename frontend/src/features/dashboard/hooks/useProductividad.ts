import { useState, useEffect, useCallback } from "react";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardProductividadResponse } from "@/features/dashboard/types";

export function useProductividad() {
  const [data, setData] = useState<DashboardProductividadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getProductividad();
      setData(res.data.data);
    } catch {
      setError("Error al cargar los datos de productividad");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportToExcel = useCallback(async () => {
    try {
      const res = await dashboardApi.exportProductividad();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "dashboard_productividad.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Error al exportar a Excel");
    }
  }, []);

  return { data, loading, error, refetch: fetchData, exportToExcel };
}
