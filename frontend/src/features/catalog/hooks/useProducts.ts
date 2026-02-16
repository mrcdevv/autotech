import { useState, useCallback, useEffect } from "react";

import { productsApi } from "@/api/products";

import type { ProductResponse, ProductRequest } from "@/types/catalog";

export function useProducts() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [query, setQuery] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.search(query || undefined, page, pageSize);
      setProducts(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch {
      setError("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (data: ProductRequest): Promise<ProductResponse> => {
    const res = await productsApi.create(data);
    await fetchProducts();
    return res.data.data;
  };

  const updateProduct = async (id: number, data: ProductRequest): Promise<ProductResponse> => {
    const res = await productsApi.update(id, data);
    await fetchProducts();
    return res.data.data;
  };

  const deleteProduct = async (id: number): Promise<void> => {
    await productsApi.delete(id);
    await fetchProducts();
  };

  return {
    products,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    setQuery,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}
