import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { MonoText } from "@/components/MonoText";
import { BILLING_COLORS } from "@/features/dashboard/utils/chartTheme";
import { formatCurrency } from "@/utils/formatCurrency";

import type { ServiceStatsResponse } from "@/features/dashboard/types";

interface ServiceStatsTableProps {
  services: ServiceStatsResponse[];
}

/** How often each service was billed and how much it brought in. */
export function ServiceStatsTable({ services }: ServiceStatsTableProps) {
  const totalRevenue = services.reduce((sum, item) => sum + item.totalRevenue, 0);
  const maxShare = Math.max(...services.map((item) => item.totalRevenue), 1);

  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <TableCell>Servicio</TableCell>
            <TableCell align="right">Veces</TableCell>
            <TableCell align="right">Precio prom.</TableCell>
            <TableCell align="right">Ingresos</TableCell>
            <TableCell sx={{ width: "26%" }}>% del total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.map((item) => {
            const share = totalRevenue > 0 ? item.totalRevenue / totalRevenue : 0;
            return (
              <TableRow key={item.serviceName}>
                <TableCell sx={{ fontWeight: 500 }}>{item.serviceName}</TableCell>
                <TableCell align="right">
                  <MonoText>{item.count}</MonoText>
                </TableCell>
                <TableCell align="right">
                  <MonoText>{formatCurrency(item.count > 0 ? item.totalRevenue / item.count : 0)}</MonoText>
                </TableCell>
                <TableCell align="right">
                  <MonoText>{formatCurrency(item.totalRevenue)}</MonoText>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, height: 8, bgcolor: "grey.200" }}>
                      <Box
                        sx={{
                          height: "100%",
                          width: `${(item.totalRevenue / maxShare) * 100}%`,
                          bgcolor: BILLING_COLORS.collected,
                        }}
                      />
                    </Box>
                    <MonoText sx={{ display: "block", width: 48, textAlign: "right", fontSize: 12 }}>
                      {`${(share * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`}
                    </MonoText>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
