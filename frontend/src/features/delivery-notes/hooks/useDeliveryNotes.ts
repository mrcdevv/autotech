import { useState, useEffect, useCallback } from "react";

import { deliveryNotesApi } from "@/api/deliveryNotes";

import type { DeliveryNoteResponse, DeliveryNoteStatus } from "@/types/deliveryNote";

export function useDeliveryNotes() {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [clientName, setClientName] = useState<string | undefined>(undefined);
  const [plate, setPlate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<DeliveryNoteStatus | undefined>(undefined);

  const fetchDeliveryNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deliveryNotesApi.getAll({
        clientName,
        plate,
        status,
        page,
        size: pageSize,
      });
      setDeliveryNotes(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch {
      setError("Error al cargar remitos");
    } finally {
      setLoading(false);
    }
  }, [clientName, plate, status, page, pageSize]);

  useEffect(() => {
    fetchDeliveryNotes();
  }, [fetchDeliveryNotes]);

  const deleteDeliveryNote = async (id: number) => {
    await deliveryNotesApi.delete(id);
    fetchDeliveryNotes();
  };

  return {
    deliveryNotes,
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
    deleteDeliveryNote,
    refetch: fetchDeliveryNotes,
  };
}
