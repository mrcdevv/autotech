import { useState, useEffect, useCallback } from "react";

import { calendarConfigApi } from "@/api/calendarConfig";

import type { CalendarConfigResponse, CalendarConfigRequest } from "@/types/appointment";

export function useCalendarConfig() {
  const [config, setConfig] = useState<CalendarConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await calendarConfigApi.getConfig();
      setConfig(res.data.data);
    } catch {
      setError("Error al cargar la configuración del calendario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (data: CalendarConfigRequest) => {
    await calendarConfigApi.updateConfig(data);
    await fetchConfig();
  };

  return { config, loading, error, updateConfig, refetch: fetchConfig };
}
