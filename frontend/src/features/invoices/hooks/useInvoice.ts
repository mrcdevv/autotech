import { useState, useEffect, useCallback } from "react";

import { invoicesApi } from "@/api/invoices";

import type { InvoiceDetailResponse, InvoiceRequest } from "@/types/invoice";

export function useInvoice(id?: number, repairOrderId?: number) {
  const [invoice, setInvoice] = useState<InvoiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!id && !repairOrderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (id) {
        const res = await invoicesApi.getById(id);
        setInvoice(res.data.data);
      } else if (repairOrderId) {
        const res = await invoicesApi.getByRepairOrderId(repairOrderId);
        setInvoice(res.data.data);
      }
    } catch {
      setError("Error al cargar la factura");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [id, repairOrderId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const createInvoice = async (data: InvoiceRequest) => {
    const res = await invoicesApi.create(data);
    setInvoice(res.data.data);
    return res.data.data;
  };

  const createFromEstimate = async (estimateId: number) => {
    const res = await invoicesApi.createFromEstimate(estimateId);
    setInvoice(res.data.data);
    return res.data.data;
  };

  const clearError = () => setError(null);

  return {
    invoice,
    loading,
    error,
    clearError,
    createInvoice,
    createFromEstimate,
    refetch: fetchInvoice,
  };
}
