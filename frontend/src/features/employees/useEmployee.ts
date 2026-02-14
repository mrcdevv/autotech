import { useState, useEffect } from "react";

import { employeesApi } from "@/api/employees";
import type { EmployeeResponse } from "@/features/employees/types";

export function useEmployee(id: number) {
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    employeesApi
      .getById(id)
      .then((res) => setEmployee(res.data.data))
      .catch(() => setError("Error al cargar el empleado"))
      .finally(() => setLoading(false));
  }, [id]);

  return { employee, loading, error };
}
