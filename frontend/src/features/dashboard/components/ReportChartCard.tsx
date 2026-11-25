import { Alert, Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";

import type { ReactNode } from "react";

interface ReportChartCardProps {
  title: string;
  subtitle?: string;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  action?: ReactNode;
  children: ReactNode;
}

export function ReportChartCard({
  title,
  subtitle,
  loading,
  error,
  isEmpty,
  action,
  children,
}: ReportChartCardProps) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1, minWidth: 0, p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 1,
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : isEmpty ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
            <Typography color="text.secondary" align="center">
              No hay datos disponibles para el período seleccionado.
            </Typography>
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
