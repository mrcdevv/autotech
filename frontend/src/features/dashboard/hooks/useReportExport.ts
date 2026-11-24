import { useCallback, useState } from "react";

import { dashboardApi } from "@/api/dashboard";

/** Downloads the reports of a period as an Excel workbook. */
export function useReportExport(from: string, to: string) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToExcel = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await dashboardApi.exportReports(from, to);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `reportes_${from}_${to}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo exportar el reporte a Excel.");
    } finally {
      setExporting(false);
    }
  }, [from, to]);

  return { exporting, error, exportToExcel, clearError: () => setError(null) };
}
