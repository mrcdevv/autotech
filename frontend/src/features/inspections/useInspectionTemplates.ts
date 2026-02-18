import { useState, useEffect, useCallback } from "react";

import { inspectionTemplatesApi } from "@/api/inspections";

import type { InspectionTemplateResponse } from "@/features/inspections/types";

export function useInspectionTemplates() {
  const [templates, setTemplates] = useState<InspectionTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectionTemplatesApi.getAll();
      setTemplates(res.data.data);
    } catch {
      setError("Error al cargar plantillas de inspección");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}
