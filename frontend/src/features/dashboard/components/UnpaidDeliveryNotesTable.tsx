import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { Link as RouterLink } from "react-router";

import { MonoText } from "@/components/MonoText";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";

import type { StatusTone } from "@/theme/tokens";
import type { UnpaidDeliveryNoteResponse } from "@/features/dashboard/types";

/** Same thresholds as the debt aging buckets. */
function agingTone(days: number): StatusTone {
  if (days > 90) return "bad";
  if (days > 60) return "parts";
  if (days > 30) return "warn";
  return "neutral";
}

interface UnpaidDeliveryNotesTableProps {
  deliveryNotes: UnpaidDeliveryNoteResponse[];
}

export function UnpaidDeliveryNotesTable({ deliveryNotes }: UnpaidDeliveryNotesTableProps) {
  if (deliveryNotes.length === 0) {
    return <Typography color="text.secondary">No hay remitos pendientes de cobro.</Typography>;
  }

  const today = dayjs();

  return (
    <TableContainer sx={{ maxHeight: 420 }}>
      <Table size="small" stickyHeader sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            <TableCell>Cliente</TableCell>
            <TableCell>Patente</TableCell>
            <TableCell>Emitido</TableCell>
            <TableCell>Antigüedad</TableCell>
            <TableCell align="right">Monto</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {deliveryNotes.map((note) => {
            const days = today.diff(dayjs(note.createdAt), "day");
            return (
              <TableRow key={note.deliveryNoteId} hover>
                <TableCell>
                  <Link component={RouterLink} to={`/remitos/${note.deliveryNoteId}`} underline="hover">
                    {note.clientFullName}
                  </Link>
                </TableCell>
                <TableCell>
                  <MonoText>{note.vehiclePlate ?? "—"}</MonoText>
                </TableCell>
                <TableCell>{dayjs(note.createdAt).format("DD/MM/YYYY")}</TableCell>
                <TableCell>
                  <StatusBadge label={`${days} ${days === 1 ? "día" : "días"}`} tone={agingTone(days)} />
                </TableCell>
                <TableCell align="right">
                  <MonoText>{formatCurrency(note.total)}</MonoText>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
