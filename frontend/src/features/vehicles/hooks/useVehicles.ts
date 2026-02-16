import { useState, useCallback, useEffect } from "react";

import { vehiclesApi } from "@/api/vehicles";

import type { VehicleResponse, VehicleRequest } from "@/types/vehicle";

type FilterType = "brand" | "year" | "model";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [searchPlate, setSearchPlate] = useState("");
  const [activeFilter, setActiveFilter] = useState<{ type: FilterType; value: string | number } | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (searchPlate) {
        res = await vehiclesApi.searchByPlate(searchPlate, page, pageSize);
      } else if (activeFilter) {
        switch (activeFilter.type) {
          case "brand":
            res = await vehiclesApi.filterByBrand(activeFilter.value as number, page, pageSize);
            break;
          case "year":
            res = await vehiclesApi.filterByYear(activeFilter.value as number, page, pageSize);
            break;
          case "model":
            res = await vehiclesApi.filterByModel(activeFilter.value as string, page, pageSize);
            break;
        }
      } else {
        res = await vehiclesApi.getAll(page, pageSize);
      }
      if (res) {
        setVehicles(res.data.data.content);
        setTotalCount(res.data.data.totalElements);
      }
    } catch {
      setError("Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  }, [searchPlate, activeFilter, page, pageSize]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const createVehicle = async (data: VehicleRequest): Promise<VehicleResponse> => {
    const res = await vehiclesApi.create(data);
    await fetchVehicles();
    return res.data.data;
  };

  const updateVehicle = async (id: number, data: VehicleRequest): Promise<VehicleResponse> => {
    const res = await vehiclesApi.update(id, data);
    await fetchVehicles();
    return res.data.data;
  };

  const deleteVehicle = async (id: number): Promise<void> => {
    await vehiclesApi.delete(id);
    await fetchVehicles();
  };

  const applyFilter = (type: FilterType, value: string | number) => {
    setSearchPlate("");
    setActiveFilter({ type, value });
    setPage(0);
  };

  const clearFilters = () => {
    setSearchPlate("");
    setActiveFilter(null);
    setPage(0);
  };

  return {
    vehicles,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchPlate,
    setSearchPlate,
    activeFilter,
    applyFilter,
    clearFilters,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles,
  };
}
