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
import type { UnpaidDeliveryNoteResponse } from "@/features/dashboard/types";

interface TopUnpaidDeliveryNotesListProps {
  deliveryNotes: UnpaidDeliveryNoteResponse[];
}

export function TopUnpaidDeliveryNotesList({ deliveryNotes }: TopUnpaidDeliveryNotesListProps) {
  if (deliveryNotes.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Remitos impagas
          </Typography>
          <Typography color="text.secondary">No hay remitos pendientes</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Remitos impagas (top 10)
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
              {deliveryNotes.map((inv) => (
                <TableRow key={inv.deliveryNoteId}>
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
