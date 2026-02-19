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
  IconButton,
  Tooltip,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
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
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.repairOrderId}>
                  <TableCell>{order.clientFullName}</TableCell>
                  <TableCell>{order.vehiclePlate}</TableCell>
                  <TableCell>{order.clientPhone}</TableCell>
                  <TableCell align="right" sx={{ p: 0 }}>
                    <Tooltip title={`Llamar a ${order.clientPhone}`}>
                      <IconButton
                        size="small"
                        href={`tel:${order.clientPhone}`}
                        color="primary"
                      >
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
