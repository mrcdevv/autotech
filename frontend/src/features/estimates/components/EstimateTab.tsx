import { Box } from "@mui/material";

import { EstimateDetail } from "./EstimateDetail";

interface EstimateTabProps {
  repairOrderId: number;
}

export function EstimateTab({ repairOrderId }: EstimateTabProps) {
  return (
    <Box>
      <EstimateDetail repairOrderId={repairOrderId} />
    </Box>
  );
}
