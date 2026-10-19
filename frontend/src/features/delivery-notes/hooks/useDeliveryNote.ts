import { useState, useEffect, useCallback } from "react";

import { deliveryNotesApi } from "@/api/deliveryNotes";

import type { DeliveryNoteDetailResponse, DeliveryNoteRequest } from "@/types/deliveryNote";

export function useDeliveryNote(id?: number, repairOrderId?: number) {
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNoteDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryNote = useCallback(async () => {
    if (!id && !repairOrderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (id) {
        const res = await deliveryNotesApi.getById(id);
        setDeliveryNote(res.data.data);
      } else if (repairOrderId) {
        const res = await deliveryNotesApi.getByRepairOrderId(repairOrderId);
        setDeliveryNote(res.data.data);
      }
    } catch {
      setError("Error al cargar la remito");
      setDeliveryNote(null);
    } finally {
      setLoading(false);
    }
  }, [id, repairOrderId]);

  useEffect(() => {
    fetchDeliveryNote();
  }, [fetchDeliveryNote]);

  const createDeliveryNote = async (data: DeliveryNoteRequest) => {
    const res = await deliveryNotesApi.create(data);
    setDeliveryNote(res.data.data);
    return res.data.data;
  };

  const createFromEstimate = async (estimateId: number) => {
    const res = await deliveryNotesApi.createFromEstimate(estimateId);
    setDeliveryNote(res.data.data);
    return res.data.data;
  };

  const clearError = () => setError(null);

  return {
    deliveryNote,
    loading,
    error,
    clearError,
    createDeliveryNote,
    createFromEstimate,
    refetch: fetchDeliveryNote,
  };
}
