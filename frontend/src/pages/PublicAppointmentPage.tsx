import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";

import { InfoList } from "@/components/InfoList";
import { PublicLayout } from "@/components/PublicLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { publicAppointmentsApi } from "@/api/publicAppointments";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

import type { PublicAppointmentResponse } from "@/types/appointment";
import type { StatusTone } from "@/theme/tokens";

const CHIP: Record<PublicAppointmentResponse["confirmationStatus"], { label: string; tone: StatusTone }> = {
  PENDING: { label: "Pendiente de confirmación", tone: "warn" },
  CONFIRMED: { label: "Turno confirmado", tone: "ok" },
  DECLINED: { label: "Avisaste que no podés asistir", tone: "bad" },
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PublicAppointmentPage() {
  const { token = "" } = useParams();
  const [searchParams] = useSearchParams();
  const suggested = searchParams.get("respuesta");

  const [appointment, setAppointment] = useState<PublicAppointmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    publicAppointmentsApi
      .getByToken(token)
      .then((res) => setAppointment(res.data.data))
      .catch((err: unknown) => setError(apiErrorMessage(err, "El enlace del turno no es válido")))
      .finally(() => setLoading(false));
  }, [token]);

  const respond = async (action: "confirm" | "decline") => {
    setSubmitting(true);
    setError(null);
    try {
      const res = action === "confirm"
        ? await publicAppointmentsApi.confirm(token)
        : await publicAppointmentsApi.decline(token);
      setAppointment(res.data.data);
      setActionMessage(res.data.message);
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

  if (!appointment) {
    return (
      <PublicLayout>
        <Alert severity="error">{error ?? "El enlace del turno no es válido"}</Alert>
      </PublicLayout>
    );
  }

  const start = dayjs(appointment.startTime).locale("es");
  const end = dayjs(appointment.endTime);
  const chip = appointment.status === "CANCELLED"
    ? { label: "Turno cancelado", tone: "bad" as StatusTone }
    : CHIP[appointment.confirmationStatus];

  const items = [
    { label: "Fecha", value: capitalize(start.format("dddd D [de] MMMM")) },
    { label: "Horario", value: `${start.format("HH:mm")} a ${end.format("HH:mm")}` },
    ...(appointment.vehicleDescription ? [{ label: "Vehículo", value: appointment.vehicleDescription }] : []),
    ...(appointment.purpose ? [{ label: "Motivo", value: appointment.purpose }] : []),
  ];

  return (
    <PublicLayout>
      <Stack spacing={2.5}>
        <StatusBadge label={chip.label} tone={chip.tone} sx={{ alignSelf: "flex-start", fontSize: "0.75rem", px: 1.25 }} />
        <Typography variant="h5" component="h1" sx={{ fontWeight: 650 }}>
          {appointment.clientFirstName ? `Hola ${appointment.clientFirstName}, este es tu turno` : "Tu turno"}
        </Typography>

        <InfoList items={items} />

        {actionMessage && <Alert severity="success">{actionMessage}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {appointment.status === "CANCELLED" ? (
          <Alert severity="info">El taller canceló este turno. Comunicate con nosotros para sacar uno nuevo.</Alert>
        ) : !appointment.canRespond ? (
          <Alert severity="info">Este turno ya pasó, no hace falta que respondas.</Alert>
        ) : (
          <>
            <Typography color="text.secondary">
              {suggested === "no-puedo"
                ? "¿Confirmás que no podés asistir? Te vamos a contactar para buscar otro horario."
                : "¿Podés venir en este horario? Confirmanos así lo dejamos reservado."}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant={suggested === "no-puedo" ? "outlined" : "contained"}
                size="large"
                disabled={submitting || appointment.confirmationStatus === "CONFIRMED"}
                onClick={() => respond("confirm")}
              >
                Confirmar turno
              </Button>
              <Button
                variant={suggested === "no-puedo" ? "contained" : "outlined"}
                color={suggested === "no-puedo" ? "primary" : "inherit"}
                size="large"
                disabled={submitting || appointment.confirmationStatus === "DECLINED"}
                onClick={() => respond("decline")}
              >
                No puedo asistir
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </PublicLayout>
  );
}
