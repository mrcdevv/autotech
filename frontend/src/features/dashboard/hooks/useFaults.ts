import { dashboardApi } from "@/api/dashboard";
import { useGuardedRequest } from "@/hooks/useGuardedRequest";

import type { FaultCountResponse } from "@/features/dashboard/types";

export function useFaults(from: string, to: string, brandId: number | null) {
  const { data, loading, error, refetch } = useGuardedRequest<FaultCountResponse[]>(
    async () => {
      const res = await dashboardApi.getReportFaults(from, to, brandId);
      return res.data.data;
    },
    "No se pudieron cargar los datos de este informe.",
    [from, to, brandId],
  );

  // Preserve the public type: this hook's data has always been a (possibly empty) array.
  return { data: data ?? [], loading, error, refetch };
}
