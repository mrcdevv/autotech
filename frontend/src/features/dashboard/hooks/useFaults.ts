import { useState, useEffect, useCallback } from "react";

import { dashboardApi } from "@/api/dashboard";

import type { FaultCountResponse } from "@/features/dashboard/types";

export function useFaults(from: string, to: string, brandId: number | null) {
  const [data, setData] = useState<FaultCountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getReportFaults(from, to, brandId);
      setData(res.data.data);
    } catch {
      setError("No se pudieron cargar los datos de este informe.");
    } finally {
      setLoading(false);
    }
  }, [from, to, brandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
