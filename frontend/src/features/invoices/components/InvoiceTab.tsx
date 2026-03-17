import { Box } from "@mui/material";

import { InvoiceDetail } from "./InvoiceDetail";

interface InvoiceTabProps {
  repairOrderId: number;
}

export function InvoiceTab({ repairOrderId }: InvoiceTabProps) {
  return (
    <Box>
      <InvoiceDetail repairOrderId={repairOrderId} />
    </Box>
  );
}
