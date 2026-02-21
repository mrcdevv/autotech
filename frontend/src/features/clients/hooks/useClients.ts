import { useState, useEffect, useCallback } from "react";
import { clientsApi } from "@/api/clients";
import type { Client } from "@/features/clients/types/client";

export function useClients(initialPage = 0, initialSize = 12) {
    const [clients, setClients] = useState<Client[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(initialPage);
    const [size, setSize] = useState(initialSize);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = query
                ? await clientsApi.search(query, page, size)
                : await clientsApi.getAll(page, size);

            setClients(res.data.data.content || []);
            setTotalElements(res.data.data.totalElements || 0);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al cargar los clientes");
        } finally {
            setLoading(false);
        }
    }, [page, size, query]);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    return { clients, totalElements, page, size, setPage, setSize, loading, error, refetch: fetchClients, setQuery };
}
