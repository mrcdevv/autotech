import { useState, useEffect, useCallback } from "react";

import { repairOrdersApi } from "@/api/repairOrders";

import type { RepairOrderResponse, StatusUpdateRequest } from "../types";

export function useRepairOrders() {
  const [orders, setOrders] = useState<RepairOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repairOrdersApi.getAll();
      setOrders(res.data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar las órdenes de trabajo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const searchOrders = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await repairOrdersApi.search(query);
      setOrders(res.data.data);
    } catch {
      setError("Error al buscar órdenes");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterByEmployee = useCallback(async (employeeId: number) => {
    setLoading(true);
    try {
      const res = await repairOrdersApi.filterByEmployee(employeeId);
      setOrders(res.data.data);
    } catch {
      setError("Error al filtrar por empleado");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterByTag = useCallback(async (tagId: number) => {
    setLoading(true);
    try {
      const res = await repairOrdersApi.filterByTag(tagId);
      setOrders(res.data.data);
    } catch {
      setError("Error al filtrar por etiqueta");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: number, request: StatusUpdateRequest) => {
    await repairOrdersApi.updateStatus(id, request);
    await fetchOrders();
  }, [fetchOrders]);

  return {
    orders, loading, error,
    refetch: fetchOrders,
    searchOrders, filterByEmployee, filterByTag, updateStatus,
  };
}
