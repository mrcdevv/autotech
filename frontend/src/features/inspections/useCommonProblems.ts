import { useState, useEffect, useCallback } from "react";

import { commonProblemsApi } from "@/api/inspections";

import type { CommonProblemResponse } from "@/features/inspections/types";

export function useCommonProblems() {
  const [problems, setProblems] = useState<CommonProblemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commonProblemsApi.getAll();
      setProblems(res.data.data);
    } catch {
      setError("Error al cargar problemas comunes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return { problems, loading, error, refetch: fetchProblems };
}
