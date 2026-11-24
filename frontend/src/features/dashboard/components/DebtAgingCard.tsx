import { Box, Stack, Typography } from "@mui/material";

import { MonoText } from "@/components/MonoText";
import { DEBT_AGING_COLORS } from "@/features/dashboard/utils/chartTheme";
import { formatCurrency } from "@/utils/formatCurrency";

import type { DebtAgingResponse } from "@/features/dashboard/types";

const RANGE_LABELS: Record<string, string> = {
  "0-30": "0 a 30 días",
  "31-60": "31 a 60 días",
  "61-90": "61 a 90 días",
  "90+": "Más de 90 días",
};

interface DebtAgingCardProps {
  data: DebtAgingResponse[];
}

export function DebtAgingCard({ data }: DebtAgingCardProps) {
  const total = data.reduce((sum, row) => sum + row.totalAmount, 0);
  const count = data.reduce((sum, row) => sum + row.deliveryNoteCount, 0);

  if (count === 0) {
    return <Typography color="text.secondary">No hay remitos pendientes de cobro.</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {formatCurrency(total)} en {count} {count === 1 ? "remito" : "remitos"}, a la fecha de hoy
      </Typography>
      <Box aria-hidden sx={{ display: "flex", height: 12, gap: "2px", overflow: "hidden" }}>
        {data.map((row, index) =>
          row.totalAmount > 0 ? (
            <Box
              key={row.range}
              sx={{ width: `${(row.totalAmount / total) * 100}%`, bgcolor: DEBT_AGING_COLORS[index] }}
            />
          ) : null
        )}
      </Box>
      <Box>
        {data.map((row, index) => (
          <Box
            key={row.range}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 1.25,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ width: 12, height: 12, flexShrink: 0, bgcolor: DEBT_AGING_COLORS[index] }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {RANGE_LABELS[row.range] ?? row.range}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.deliveryNoteCount} {row.deliveryNoteCount === 1 ? "remito" : "remitos"}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 600 }}>
              <MonoText>{formatCurrency(row.totalAmount)}</MonoText>
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
