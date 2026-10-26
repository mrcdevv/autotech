import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";

import { PublicLayout } from "@/components/PublicLayout";
import { publicUnsubscribeApi } from "@/api/publicUnsubscribe";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

import type { PublicUnsubscribeResponse } from "@/types/notification";

export default function PublicUnsubscribePage() {
  const { token = "" } = useParams();
  const [data, setData] = useState<PublicUnsubscribeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicUnsubscribeApi
      .getByToken(token)
      .then((res) => setData(res.data.data))
      .catch((err: unknown) => setError(apiErrorMessage(err, "El enlace para darte de baja no es válido")))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUnsubscribe = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await publicUnsubscribeApi.unsubscribe(token);
      setData(res.data.data);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "No pudimos procesar la baja. Intentá de nuevo."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !data ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Stack spacing={2.5}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 650 }}>
            {data.optedOut ? "Listo, te diste de baja" : "Recordatorios por email"}
          </Typography>
          {data.optedOut ? (
            <Typography color="text.secondary">
              {data.clientFirstName}, ya no vas a recibir recordatorios de turnos, services ni pagos. Vas a seguir
              recibiendo los avisos de tus turnos y órdenes de trabajo en curso.
            </Typography>
          ) : (
            <>
              <Typography color="text.secondary">
                Hola {data.clientFirstName}, ¿querés dejar de recibir recordatorios por email (turnos, services y
                saldos pendientes)?
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                variant="contained"
                size="large"
                onClick={handleUnsubscribe}
                disabled={submitting}
                sx={{ alignSelf: "flex-start" }}
              >
                Darme de baja
              </Button>
            </>
          )}
        </Stack>
      )}
    </PublicLayout>
  );
}
