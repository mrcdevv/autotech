import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { formatCurrency } from "@/utils/formatCurrency";
import type { DebtAgingResponse } from "@/features/dashboard/types";

interface DebtAgingTableProps {
  data: DebtAgingResponse[];
}

export function DebtAgingTable({ data }: DebtAgingTableProps) {
  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Antigüedad de deuda
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rango (días)</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Monto total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.range}>
                <TableCell>{row.range}</TableCell>
                <TableCell align="right">{row.invoiceCount}</TableCell>
                <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
