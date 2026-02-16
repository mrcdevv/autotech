import { useState, useCallback, useEffect } from "react";

import { brandsApi } from "@/api/brands";

import type { BrandResponse } from "@/types/vehicle";

export function useBrands() {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await brandsApi.getAll();
      setBrands(res.data.data);
    } catch {
      // Silent — brands are auxiliary data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const createBrand = async (name: string): Promise<BrandResponse> => {
    const res = await brandsApi.create({ name });
    await fetchBrands();
    return res.data.data;
  };

  return { brands, loading, createBrand, refetch: fetchBrands };
}
