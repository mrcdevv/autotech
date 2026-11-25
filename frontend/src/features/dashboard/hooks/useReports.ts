import { dashboardApi } from "@/api/dashboard";
import { useGuardedRequest } from "@/hooks/useGuardedRequest";

import type { DashboardReportsResponse } from "@/features/dashboard/types";

/** Reports of a period. An empty `from` or `to` skips the request and yields null. */
export function useReports(from: string, to: string) {
  return useGuardedRequest<DashboardReportsResponse | null>(
    async () => {
      if (!from || !to) return null;
      const res = await dashboardApi.getReports(from, to);
      return res.data.data;
    },
    "No se pudieron cargar los datos de este informe.",
    [from, to],
  );
}
