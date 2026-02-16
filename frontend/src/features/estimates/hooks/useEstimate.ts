import { useState, useEffect, useCallback } from "react";

import { estimatesApi } from "@/api/estimates";

import type { EstimateDetailResponse, EstimateRequest } from "@/types/estimate";

export function useEstimate(id?: number, repairOrderId?: number) {
  const [estimate, setEstimate] = useState<EstimateDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimate = useCallback(async () => {
    if (!id && !repairOrderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (id) {
        const res = await estimatesApi.getById(id);
        setEstimate(res.data.data);
      } else if (repairOrderId) {
        const res = await estimatesApi.getByRepairOrderId(repairOrderId);
        setEstimate(res.data.data);
      }
    } catch {
      setError("Error al cargar el presupuesto");
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }, [id, repairOrderId]);

  useEffect(() => {
    fetchEstimate();
  }, [fetchEstimate]);

  const createEstimate = async (data: EstimateRequest) => {
    const res = await estimatesApi.create(data);
    setEstimate(res.data.data);
    return res.data.data;
  };

  const updateEstimate = async (estimateId: number, data: EstimateRequest) => {
    const res = await estimatesApi.update(estimateId, data);
    setEstimate(res.data.data);
    return res.data.data;
  };

  const approveEstimate = async (estimateId: number) => {
    const res = await estimatesApi.approve(estimateId);
    setEstimate(res.data.data);
    return res.data.data;
  };

  const rejectEstimate = async (estimateId: number) => {
    const res = await estimatesApi.reject(estimateId);
    setEstimate(res.data.data);
    return res.data.data;
  };

  const clearError = () => setError(null);

  return {
    estimate,
    loading,
    error,
    clearError,
    createEstimate,
    updateEstimate,
    approveEstimate,
    rejectEstimate,
    refetch: fetchEstimate,
  };
}
