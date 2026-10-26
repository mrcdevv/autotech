import { useState, useEffect, useCallback } from "react";

import { paymentsApi } from "@/api/payments";

import type { PaymentRequest, PaymentResponse } from "@/types/payment";

export function usePayments(deliveryNoteId: number) {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getByDeliveryNote(deliveryNoteId);
      setPayments(res.data.data);
    } catch {
      setError("Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  }, [deliveryNoteId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const createPayment = async (data: PaymentRequest) => {
    const res = await paymentsApi.create(deliveryNoteId, data);
    await fetchPayments();
    return res.data.data;
  };

  const updatePayment = async (paymentId: number, data: PaymentRequest) => {
    const res = await paymentsApi.update(deliveryNoteId, paymentId, data);
    await fetchPayments();
    return res.data.data;
  };

  const deletePayment = async (paymentId: number, performedBy: number) => {
    await paymentsApi.delete(deliveryNoteId, paymentId, performedBy);
    await fetchPayments();
  };

  return {
    payments,
    loading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
    refetch: fetchPayments,
  };
}
