import { useCallback } from "react";

import { dashboardApi } from "@/api/dashboard";
import { useGuardedRequest } from "@/hooks/useGuardedRequest";

import type { DashboardFinancieroResponse } from "@/features/dashboard/types";

export function useFinanciero(months: number = 6) {
  const { data, loading, error, refetch, setError } =
    useGuardedRequest<DashboardFinancieroResponse>(
    async () => {
      const res = await dashboardApi.getFinanciero(months);
      return res.data.data;
    },
    "Error al cargar los datos financieros",
    [months],
  );

  const exportToExcel = useCallback(async () => {
    try {
      const res = await dashboardApi.exportFinanciero(months);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "dashboard_financiero.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Error al exportar a Excel");
    }
  }, [months, setError]);

  return { data, loading, error, refetch, exportToExcel };
}
