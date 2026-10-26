import { Box, Typography } from "@mui/material";

import { MonoText } from "@/components/MonoText";
import { Panel } from "@/components/Panel";
import { ProgressBar } from "@/components/ProgressBar";
import { dot } from "@/theme/tokens";
import type { DailyCashView } from "@/features/dashboard/utils/homeView";

interface DailyCashProps {
  cash: DailyCashView;
}

export function DailyCash({ cash }: DailyCashProps) {
  return (
    <Panel title="Caja del día" contentSx={{ mt: "2px" }}>
      {/* Alignment lives on the block containers, never on the inline MonoText span
          (text-align has no effect on an inline element). */}
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 500, textAlign: "right" }}>
        <MonoText>{cash.total}</MonoText>
      </Typography>
      <Box sx={{ fontSize: "0.78125rem", color: "text.muted", mt: "3px", textAlign: "right" }}>
        {cash.paidCount} {cash.paidCount === 1 ? "remito cobrada" : "remitos cobradas"} ·{" "}
        {cash.pendingCount} {cash.pendingCount === 1 ? "pendiente" : "pendientes"} (
        {cash.pendingTotal})
      </Box>
      <ProgressBar value={cash.paidRatio} color={dot.ok} sx={{ mt: "12px", bgcolor: "divider" }} />
    </Panel>
  );
}
