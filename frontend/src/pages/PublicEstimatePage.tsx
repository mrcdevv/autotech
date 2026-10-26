import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import dayjs from "dayjs";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { PublicLayout } from "@/components/PublicLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { publicEstimatesApi } from "@/api/publicEstimates";
import { apiErrorMessage } from "@/utils/apiErrorMessage";
import { formatCurrency } from "@/utils/formatCurrency";

import type { PublicEstimateResponse } from "@/types/estimate";
import type { StatusTone } from "@/theme/tokens";

const STATUS_CHIP: Record<PublicEstimateResponse["status"], { label: string; tone: StatusTone }> = {
  PENDIENTE: { label: "Esperando tu aprobación", tone: "warn" },
  ACEPTADO: { label: "Presupuesto aprobado", tone: "ok" },
  RECHAZADO: { label: "Presupuesto rechazado", tone: "bad" },
};

function padNumber(value: number): string {
  return String(value).padStart(4, "0");
}

export default function PublicEstimatePage() {
  const { token = "" } = useParams();
  const [searchParams] = useSearchParams();
  const suggested = searchParams.get("decision");

  const [estimate, setEstimate] = useState<PublicEstimateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    publicEstimatesApi
      .getByToken(token)
      .then((res) => setEstimate(res.data.data))
      .catch((err: unknown) => setError(apiErrorMessage(err, "El enlace del presupuesto no es válido")))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (suggested === "aprobar") setPending("approve");
    if (suggested === "rechazar") setPending("reject");
  }, [suggested]);

  const decide = async (action: "approve" | "reject") => {
    setSubmitting(true);
    setError(null);
    try {
      const res = action === "approve"
        ? await publicEstimatesApi.approve(token)
        : await publicEstimatesApi.reject(token);
      setEstimate(res.data.data);
      setActionMessage(res.data.message);
      setPending(null);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "No pudimos registrar tu respuesta. Intentá de nuevo."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </PublicLayout>
    );
  }

  if (!estimate) {
    return (
      <PublicLayout>
        <Alert severity="error">{error ?? "El enlace del presupuesto no es válido"}</Alert>
      </PublicLayout>
    );
  }

  const chip = STATUS_CHIP[estimate.status];
  const lines = [
    ...estimate.services.map((s) => ({ key: `s-${s.id}`, label: s.serviceName, amount: s.price })),
    ...estimate.products.map((p) => ({ key: `p-${p.id}`, label: `${p.productName} x${p.quantity}`, amount: p.totalPrice })),
  ];

  return (
    <PublicLayout>
      <Stack spacing={2.5}>
        <StatusBadge label={chip.label} tone={chip.tone} sx={{ alignSelf: "flex-start", fontSize: "0.75rem", px: 1.25 }} />
        <Typography variant="h5" component="h1" sx={{ fontWeight: 650 }}>
          Presupuesto #{padNumber(estimate.estimateNumber)}
        </Typography>
        <Typography color="text.secondary">
          Hola {estimate.clientFirstName}, este es el detalle de lo que recomendamos hacer en tu {estimate.vehicleDescription}.
        </Typography>

        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          {lines.map((line) => (
            <Stack key={line.key} direction="row" justifyContent="space-between" spacing={2} sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="body2">{line.label}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>{formatCurrency(line.amount)}</Typography>
            </Stack>
          ))}
          {estimate.discountPercentage > 0 && (
            <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="body2" color="text.secondary">Descuento</Typography>
              <Typography variant="body2" color="text.secondary">{estimate.discountPercentage} %</Typography>
            </Stack>
          )}
          {estimate.taxPercentage > 0 && (
            <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="body2" color="text.secondary">IVA</Typography>
              <Typography variant="body2" color="text.secondary">{estimate.taxPercentage} %</Typography>
            </Stack>
          )}
          <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.5, bgcolor: "background.default" }}>
            <Typography sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatCurrency(estimate.total ?? 0)}</Typography>
          </Stack>
        </Box>

        {estimate.inspectionIssues.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Informe de inspección</Typography>
            {estimate.inspectionIssues.map((issue) => (
              <Stack key={issue.inspectionItemId} direction="row" spacing={1.25} alignItems="flex-start">
                <StatusBadge
                  label={issue.status === "PROBLEMA" ? "Urgente" : "Puede esperar"}
                  tone={issue.status === "PROBLEMA" ? "bad" : "warn"}
                />
                <Typography variant="body2" color="text.secondary">
                  {issue.itemName}{issue.comment ? `: ${issue.comment}` : ""}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        <Divider />

        {actionMessage && <Alert severity="success">{actionMessage}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {estimate.canDecide ? (
          pending ? (
            <Stack spacing={1.5}>
              <Typography>
                {pending === "approve"
                  ? "¿Confirmás que aprobás este presupuesto? El taller va a comenzar con los trabajos."
                  : "¿Confirmás que no querés realizar estos trabajos? El taller se va a comunicar con vos."}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  color={pending === "approve" ? "primary" : "error"}
                  disabled={submitting}
                  onClick={() => decide(pending)}
                >
                  {pending === "approve" ? "Sí, aprobar presupuesto" : "Sí, rechazar presupuesto"}
                </Button>
                <Button variant="text" color="inherit" disabled={submitting} onClick={() => setPending(null)}>
                  Volver
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button variant="contained" size="large" onClick={() => setPending("approve")}>
                  Aprobar presupuesto
                </Button>
                <Button variant="outlined" color="inherit" size="large" onClick={() => setPending("reject")}>
                  Rechazar
                </Button>
              </Stack>
              {estimate.expiresAt && (
                <Typography variant="caption" color="text.secondary">
                  El enlace es personal y vence el {dayjs(estimate.expiresAt).format("DD/MM/YYYY")}.
                </Typography>
              )}
            </Stack>
          )
        ) : (
          !actionMessage && (
            <Alert severity="info">
              {estimate.status === "PENDIENTE"
                ? "El enlace venció. Comunicate con el taller para recibir uno nuevo."
                : `Este presupuesto ya fue ${estimate.status === "ACEPTADO" ? "aprobado" : "rechazado"}${
                    estimate.decidedAt ? ` el ${dayjs(estimate.decidedAt).format("DD/MM/YYYY")}` : ""
                  }.`}
            </Alert>
          )
        )}
      </Stack>
    </PublicLayout>
  );
}
