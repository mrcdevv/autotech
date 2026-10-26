import { useState, useEffect, useCallback, useRef } from "react";

import { repairOrdersApi } from "@/api/repairOrders";

import type { RepairOrderListParams } from "@/api/repairOrders";
import type { RepairOrderResponse, StatusUpdateRequest } from "../types";

export function useRepairOrders(params: RepairOrderListParams = {}) {
  const [orders, setOrders] = useState<RepairOrderResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against out-of-order responses: only the newest request may write state.
  const requestIdRef = useRef(0);

  // Serialize the params so the effect only re-runs when a value actually changes.
  const paramsKey = JSON.stringify(params);

  const fetchOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await repairOrdersApi.search(JSON.parse(paramsKey));
      if (requestId !== requestIdRef.current) return;
      setOrders(res.data.data.content);
      setTotalElements(res.data.data.totalElements);
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Error al cargar las órdenes de trabajo");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [paramsKey]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = useCallback(async (id: number, request: StatusUpdateRequest) => {
    await repairOrdersApi.updateStatus(id, request);
    await fetchOrders();
  }, [fetchOrders]);

  return { orders, totalElements, loading, error, refetch: fetchOrders, updateStatus };
}
