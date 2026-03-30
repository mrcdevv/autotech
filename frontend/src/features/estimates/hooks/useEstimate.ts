import { useState, useEffect, useCallback } from "react";

import { estimatesApi } from "@/api/estimates";

import type { EstimateDetailResponse, EstimateRequest, EstimateResponse } from "@/types/estimate";

export function useEstimate(id?: number, repairOrderId?: number) {
  const [estimate, setEstimate] = useState<EstimateDetailResponse | null>(null);
  const [allEstimates, setAllEstimates] = useState<EstimateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noActiveEstimate, setNoActiveEstimate] = useState(false);

  const fetchEstimate = useCallback(async () => {
    if (!id && !repairOrderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNoActiveEstimate(false);
    try {
      if (id) {
        const res = await estimatesApi.getById(id);
        setEstimate(res.data.data);
      } else if (repairOrderId) {
        const [activeRes, allRes] = await Promise.allSettled([
          estimatesApi.getByRepairOrderId(repairOrderId),
          estimatesApi.getAllByRepairOrderId(repairOrderId),
        ]);

        if (allRes.status === "fulfilled") {
          setAllEstimates(allRes.value.data.data);
        }

        if (activeRes.status === "fulfilled") {
          setEstimate(activeRes.value.data.data);
        } else {
          setEstimate(null);
          setNoActiveEstimate(true);
        }
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
    setNoActiveEstimate(false);
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
    await fetchEstimate();
    return res.data.data;
  };

  const clearError = () => setError(null);

  return {
    estimate,
    allEstimates,
    noActiveEstimate,
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
