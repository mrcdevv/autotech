import { dashboardApi } from "@/api/dashboard";
import { useGuardedRequest } from "@/hooks/useGuardedRequest";

import type { DashboardReportsResponse } from "@/features/dashboard/types";

export function useReports(from: string, to: string) {
  return useGuardedRequest<DashboardReportsResponse>(
    async () => {
      const res = await dashboardApi.getReports(from, to);
      return res.data.data;
    },
    "No se pudieron cargar los datos de este informe.",
    [from, to],
  );
}
