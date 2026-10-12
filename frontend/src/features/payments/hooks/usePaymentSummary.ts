import { useState, useEffect, useCallback } from "react";

import { paymentsApi } from "@/api/payments";

import type { PaymentSummaryResponse } from "@/types/payment";

export function usePaymentSummary(deliveryNoteId: number) {
  const [summary, setSummary] = useState<PaymentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getSummary(deliveryNoteId);
      setSummary(res.data.data);
    } catch {
      setError("Error al cargar el resumen de pagos");
    } finally {
      setLoading(false);
    }
  }, [deliveryNoteId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
