import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { MechanicProductivityResponse } from "@/features/dashboard/types";

interface MechanicProductivityTableProps {
  data: MechanicProductivityResponse[];
}

export function MechanicProductivityTable({ data }: MechanicProductivityTableProps) {
  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Órdenes completadas por mecánico
      </Typography>
      {data.length === 0 ? (
        <Typography color="text.secondary">Sin datos este mes</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mecánico</TableCell>
                <TableCell align="right">Órdenes completadas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell>{row.employeeFullName}</TableCell>
                  <TableCell align="right">{row.completedOrders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
