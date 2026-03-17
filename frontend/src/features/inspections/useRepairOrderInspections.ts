import { useState, useEffect, useCallback } from "react";

import { inspectionsApi } from "@/api/inspections";

import type { InspectionResponse } from "@/features/inspections/types";

export function useRepairOrderInspections(repairOrderId: number) {
  const [inspections, setInspections] = useState<InspectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectionsApi.getByRepairOrder(repairOrderId);
      setInspections(res.data.data);
    } catch {
      setError("Error al cargar inspecciones");
    } finally {
      setLoading(false);
    }
  }, [repairOrderId]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  return { inspections, loading, error, refetch: fetchInspections };
}
