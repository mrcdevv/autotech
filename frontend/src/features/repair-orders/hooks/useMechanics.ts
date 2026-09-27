import { useState, useEffect, useCallback } from "react";

import { employeesApi } from "@/api/employees";
import { rolesApi } from "@/api/roles";

import type { EmployeeResponse } from "@/features/employees/types";

const MECHANIC_ROLE_NAME = "MECANICO";

/**
 * Fetches active employees holding the MECANICO role.
 * Pass `enabled: false` to defer the request until it is actually needed.
 */
export function useMechanics(enabled: boolean = true) {
  const [mechanics, setMechanics] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMechanics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rolesRes = await rolesApi.getAll();
      const mechanicRole = rolesRes.data.data.find((role) => role.name === MECHANIC_ROLE_NAME);

      if (!mechanicRole) {
        setMechanics([]);
        return;
      }

      const employeesRes = await employeesApi.filterByRole(mechanicRole.id, 0, 100);
      setMechanics(employeesRes.data.data.content.filter((employee) => employee.status === "ACTIVO"));
    } catch {
      setError("Error al cargar los mecánicos");
      setMechanics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchMechanics();
    }
  }, [enabled, fetchMechanics]);

  return { mechanics, loading, error, refetch: fetchMechanics };
}
