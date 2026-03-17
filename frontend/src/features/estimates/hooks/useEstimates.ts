import { useState, useEffect, useCallback } from "react";

import { estimatesApi } from "@/api/estimates";

import type { EstimateResponse, EstimateStatus } from "@/types/estimate";

export function useEstimates() {
  const [estimates, setEstimates] = useState<EstimateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [clientName, setClientName] = useState<string | undefined>(undefined);
  const [plate, setPlate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<EstimateStatus | undefined>(undefined);

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await estimatesApi.getAll({
        clientName,
        plate,
        status,
        page,
        size: pageSize,
      });
      setEstimates(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch {
      setError("Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  }, [clientName, plate, status, page, pageSize]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const deleteEstimate = async (id: number) => {
    await estimatesApi.delete(id);
    fetchEstimates();
  };

  return {
    estimates,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    clientName,
    setClientName,
    plate,
    setPlate,
    status,
    setStatus,
    deleteEstimate,
    refetch: fetchEstimates,
  };
}
