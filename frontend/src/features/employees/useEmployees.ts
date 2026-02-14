import { useState, useEffect, useCallback } from "react";

import { employeesApi } from "@/api/employees";
import type { EmployeeResponse } from "@/features/employees/types";
import type { PageResponse } from "@/types/api";

export function useEmployees() {
  const [employees, setEmployees] = useState<PageResponse<EmployeeResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeesApi.getAll(page);
      setEmployees(res.data.data);
    } catch {
      setError("Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { employees, loading, error, page, setPage, refetch: fetchEmployees };
}
