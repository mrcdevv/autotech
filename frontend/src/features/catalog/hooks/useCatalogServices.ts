import { useState, useCallback, useEffect } from "react";

import { catalogServicesApi } from "@/api/catalogServices";

import type { CatalogServiceResponse, CatalogServiceRequest } from "@/types/catalog";

export function useCatalogServices() {
  const [services, setServices] = useState<CatalogServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await catalogServicesApi.search(debouncedQuery || undefined, page, pageSize);
      setServices(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch {
      setError("Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, pageSize]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = async (data: CatalogServiceRequest): Promise<CatalogServiceResponse> => {
    const res = await catalogServicesApi.create(data);
    await fetchServices();
    return res.data.data;
  };

  const updateService = async (id: number, data: CatalogServiceRequest): Promise<CatalogServiceResponse> => {
    const res = await catalogServicesApi.update(id, data);
    await fetchServices();
    return res.data.data;
  };

  const deleteService = async (id: number): Promise<void> => {
    await catalogServicesApi.delete(id);
    await fetchServices();
  };

  return {
    services,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    setQuery,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices,
  };
}
