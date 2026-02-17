import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { formatCurrency } from "@/utils/formatCurrency";
import type { UnpaidInvoiceResponse } from "@/features/dashboard/types";

interface TopUnpaidInvoicesListProps {
  invoices: UnpaidInvoiceResponse[];
}

export function TopUnpaidInvoicesList({ invoices }: TopUnpaidInvoicesListProps) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Facturas impagas
          </Typography>
          <Typography color="text.secondary">No hay facturas pendientes</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Facturas impagas (top 10)
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Patente</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.invoiceId}>
                  <TableCell>{inv.clientFullName}</TableCell>
                  <TableCell>{inv.vehiclePlate ?? "—"}</TableCell>
                  <TableCell align="right">{formatCurrency(inv.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
