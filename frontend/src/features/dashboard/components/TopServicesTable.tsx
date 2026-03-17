import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { TopServiceResponse } from "@/features/dashboard/types";

interface TopServicesTableProps {
  data: TopServiceResponse[];
}

export function TopServicesTable({ data }: TopServicesTableProps) {
  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Servicios más facturados
      </Typography>
      {data.length === 0 ? (
        <Typography color="text.secondary">Sin datos este mes</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Servicio</TableCell>
                <TableCell align="right">Veces facturado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.serviceName}>
                  <TableCell>{row.serviceName}</TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
