import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Typography,
  TextField,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import { formatCurrency } from "@/utils/formatCurrency";

import { cannedJobsApi } from "@/api/cannedJobs";

import type { CannedJobResponse, CannedJobDetailResponse } from "@/types/catalog";
import type { AppliedCannedJob } from "../utils/applyCannedJob";
import { expandCannedJob } from "../utils/applyCannedJob";
import { AppDialog } from "@/components/AppDialog";

interface ApplyCannedJobDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called once with the expanded snapshot lines when the user confirms. */
  onApply: (applied: AppliedCannedJob, cannedJob: CannedJobDetailResponse) => void;
}

export function ApplyCannedJobDialog({ open, onClose, onApply }: ApplyCannedJobDialogProps) {
  const [options, setOptions] = useState<CannedJobResponse[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selected, setSelected] = useState<CannedJobResponse | null>(null);
  const [detail, setDetail] = useState<CannedJobDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [applied, setApplied] = useState<AppliedCannedJob | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const search = async (query: string) => {
    setLoadingOptions(true);
    try {
      const res = await cannedJobsApi.search(query || undefined);
      setOptions(res.data.data.content);
    } catch {
      // keep previous options on failure
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    if (open) {
      search("");
    }
  }, [open]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      setApplied(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setLoadError(null);
    cannedJobsApi
      .getById(selected.id)
      .then((res) => {
        if (cancelled) return;
        const loaded = res.data.data;
        setDetail(loaded);
        setApplied(expandCannedJob(loaded));
      })
      .catch(() => {
        if (!cancelled) setLoadError("Error al cargar el paquete");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const handleApply = () => {
    if (applied && detail) {
      onApply(applied, detail);
    }
  };

  const total =
    (applied?.services.reduce((sum, s) => sum + s.price, 0) ?? 0) +
    (applied?.products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0) ?? 0);

  return (
    <AppDialog
      open={open}
      title="Insertar paquete de servicios"
      subtitle="Agrega todos los servicios y productos del paquete al documento"
      onClose={onClose}
      maxWidth="sm"
      actions={
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <Typography variant="subtitle2">Total: {formatCurrency(total)}</Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button onClick={onClose} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleApply} variant="contained" disabled={!applied || loadingDetail}>
              Insertar
            </Button>
          </Box>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Autocomplete
          options={options}
          getOptionLabel={(o) => o.title}
          value={selected}
          inputValue={selected ? selected.title : ""}
          onInputChange={(_, value, reason) => {
            if (reason === "input" && !selected) {
              search(value);
            }
          }}
          onChange={(_, value) => setSelected(value)}
          loading={loadingOptions}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar paquete"
              size="small"
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingOptions ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />

        {loadError && (
          <Typography variant="body2" color="error">
            {loadError}
          </Typography>
        )}

        {loadingDetail && <CircularProgress size={24} sx={{ alignSelf: "center", my: 2 }} />}

        {!loadingDetail && detail && applied && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {detail.description && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {detail.description}
              </Typography>
            )}

            {applied.services.length > 0 && (
              <Table size="small" aria-label="Servicios del paquete">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Servicio</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Precio
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applied.services.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.serviceName}</TableCell>
                      <TableCell align="right">{formatCurrency(s.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {applied.products.length > 0 && (
              <Table size="small" aria-label="Productos del paquete">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Cantidad
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Precio unit.
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applied.products.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.productName}</TableCell>
                      <TableCell align="right">{p.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(p.unitPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(p.quantity * p.unitPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {applied.services.length === 0 && applied.products.length === 0 && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                El paquete no tiene servicios ni productos
              </Typography>
            )}
          </Box>
        )}

        {!detail && !loadingDetail && !loadError && selected == null && (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <LayersOutlinedIcon sx={{ fontSize: 36, color: "grey.300", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Seleccioná un paquete para ver su contenido
            </Typography>
          </Box>
        )}
      </Box>
    </AppDialog>
  );
}
