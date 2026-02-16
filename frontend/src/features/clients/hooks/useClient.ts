import { useState, useEffect } from "react";
import { clientsApi } from "@/api/clients";
import type { Client } from "@/features/clients/types/client";

export function useClient(id: number | null) {
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id === null) return;
        setLoading(true);
        setError(null);
        clientsApi.getById(id)
            .then((res) => setClient(res.data.data))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar el cliente"))
            .finally(() => setLoading(false));
    }, [id]);

    return { client, loading, error };
}
