import { useState, useEffect, useCallback } from "react";

import { repairOrdersApi } from "@/api/repairOrders";

import type { RepairOrderDetailResponse, TitleUpdateRequest } from "../types";

export function useRepairOrder(id: number) {
  const [order, setOrder] = useState<RepairOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repairOrdersApi.getById(id);
      setOrder(res.data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden de trabajo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const updateTitle = useCallback(async (data: TitleUpdateRequest) => {
    await repairOrdersApi.updateTitle(id, data);
    await fetchOrder();
  }, [id, fetchOrder]);

  return { order, loading, error, refetch: fetchOrder, updateTitle };
}
