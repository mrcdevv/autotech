import { useState, useCallback, useEffect } from "react";

import { vehicleTypesApi } from "@/api/vehicleTypes";

import type { VehicleTypeResponse } from "@/types/vehicle";

export function useVehicleTypes() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicleTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleTypesApi.getAll();
      setVehicleTypes(res.data.data);
    } catch {
      // Silent — vehicle types are auxiliary data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  return { vehicleTypes, loading };
}
