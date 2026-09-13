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

import type { ReadyForPickupResponse } from "@/features/dashboard/types";

interface ReadyForPickupListProps {
  orders: ReadyForPickupResponse[];
}

export function ReadyForPickupList({ orders }: ReadyForPickupListProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Listas para entregar
          </Typography>
          <Typography color="text.secondary">
            No hay vehículos listos para entregar
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listas para entregar
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Patente</TableCell>
                <TableCell>Teléfono</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.repairOrderId}>
                  <TableCell>{order.clientFullName}</TableCell>
                  <TableCell>{order.vehiclePlate}</TableCell>
                  <TableCell>{order.clientPhone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
