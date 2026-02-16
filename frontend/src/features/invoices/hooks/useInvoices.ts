import { useState, useEffect, useCallback } from "react";

import { invoicesApi } from "@/api/invoices";

import type { InvoiceResponse, InvoiceStatus } from "@/types/invoice";

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [clientName, setClientName] = useState<string | undefined>(undefined);
  const [plate, setPlate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<InvoiceStatus | undefined>(undefined);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoicesApi.getAll({
        clientName,
        plate,
        status,
        page,
        size: pageSize,
      });
      setInvoices(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch {
      setError("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, [clientName, plate, status, page, pageSize]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const deleteInvoice = async (id: number) => {
    await invoicesApi.delete(id);
    fetchInvoices();
  };

  return {
    invoices,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    clientName,
    setClientName,
    plate,
    setPlate,
    status,
    setStatus,
    deleteInvoice,
    refetch: fetchInvoices,
  };
}
