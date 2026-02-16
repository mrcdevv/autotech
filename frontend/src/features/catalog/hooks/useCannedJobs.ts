import { useState, useCallback, useEffect } from "react";

import { cannedJobsApi } from "@/api/cannedJobs";

import type { CannedJobResponse, CannedJobDetailResponse, CannedJobRequest } from "@/types/catalog";

export function useCannedJobs() {
  const [cannedJobs, setCannedJobs] = useState<CannedJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [query, setQuery] = useState("");

  const fetchCannedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cannedJobsApi.search(query || undefined, page, pageSize);
      setCannedJobs(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch {
      setError("Error al cargar trabajos enlatados");
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => {
    fetchCannedJobs();
  }, [fetchCannedJobs]);

  const getCannedJobById = async (id: number): Promise<CannedJobDetailResponse> => {
    const res = await cannedJobsApi.getById(id);
    return res.data.data;
  };

  const createCannedJob = async (data: CannedJobRequest): Promise<CannedJobDetailResponse> => {
    const res = await cannedJobsApi.create(data);
    await fetchCannedJobs();
    return res.data.data;
  };

  const updateCannedJob = async (id: number, data: CannedJobRequest): Promise<CannedJobDetailResponse> => {
    const res = await cannedJobsApi.update(id, data);
    await fetchCannedJobs();
    return res.data.data;
  };

  const deleteCannedJob = async (id: number): Promise<void> => {
    await cannedJobsApi.delete(id);
    await fetchCannedJobs();
  };

  return {
    cannedJobs,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    setQuery,
    getCannedJobById,
    createCannedJob,
    updateCannedJob,
    deleteCannedJob,
    refetch: fetchCannedJobs,
  };
}
