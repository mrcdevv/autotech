import { useState, useEffect, useCallback } from "react";

import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import dayjs from "dayjs";

import { productsApi } from "@/api/products";
import { AppDialog } from "@/components/AppDialog";
import { MonoText } from "@/components/MonoText";
import { StatusBadge } from "@/components/StatusBadge";

import { STOCK_MOVEMENT_TYPES, movementEffect, movementSource } from "@/features/catalog/utils/stockMovementLabels";

import type { ProductResponse, StockMovementResponse } from "@/types/catalog";

interface StockMovementsDialogProps {
  open: boolean;
  product: ProductResponse | null;
  onClose: () => void;
}

const PAGE_SIZE = 10;

export function StockMovementsDialog({ open, product, onClose }: StockMovementsDialogProps) {
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productId = product?.id;

  const fetchMovements = useCallback(async () => {
    if (productId == null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.getStockMovements(productId, page, PAGE_SIZE);
      setMovements(res.data.data.content);
      setTotalCount(res.data.data.totalElements);
    } catch {
      setError("Error al cargar los movimientos de stock");
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    if (open) fetchMovements();
  }, [open, fetchMovements]);

  useEffect(() => {
    if (open) setPage(0);
  }, [open, productId]);

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Movimientos de stock"
      subtitle={product?.name}
      icon={<HistoryIcon sx={{ fontSize: "1.25rem" }} />}
      maxWidth="md"
      actions={<Button onClick={onClose}>Cerrar</Button>}
    >
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : movements.length === 0 && !error ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
          Este producto todavía no tiene movimientos de stock.
        </Typography>
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Efecto</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{dayjs(m.createdAt).format("DD/MM/YYYY HH:mm")}</TableCell>
                  <TableCell>
                    <StatusBadge label={STOCK_MOVEMENT_TYPES[m.type].label} tone={STOCK_MOVEMENT_TYPES[m.type].tone} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <MonoText>{movementEffect(m)}</MonoText>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{movementSource(m)}</TableCell>
                  <TableCell>{m.reason ?? "—"}</TableCell>
                  <TableCell>{m.createdByName ?? "Sistema"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </>
      )}
    </AppDialog>
  );
}
