import { useState, useEffect } from "react";

import { inspectionTemplatesApi } from "@/api/inspections";

import type { InspectionTemplateResponse } from "@/features/inspections/types";

export function useInspectionTemplate(id: number | null) {
  const [template, setTemplate] = useState<InspectionTemplateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) {
      setTemplate(null);
      return;
    }
    setLoading(true);
    inspectionTemplatesApi
      .getById(id)
      .then((res) => setTemplate(res.data.data))
      .catch(() => setError("Error al cargar la plantilla"))
      .finally(() => setLoading(false));
  }, [id]);

  return { template, loading, error };
}
