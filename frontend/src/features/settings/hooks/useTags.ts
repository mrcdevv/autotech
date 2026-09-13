import { useState, useEffect, useCallback } from "react";

import { tagsApi } from "@/api/tags";

import type { TagResponse } from "@/types/appointment";

export function useTags() {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tagsApi.getAll();
      setTags(res.data.data);
    } catch {
      setError("Error al cargar etiquetas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, loading, error, refetch: fetchTags };
}
