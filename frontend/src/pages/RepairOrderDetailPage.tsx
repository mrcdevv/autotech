import { useState } from "react";

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useParams } from "react-router";
import EditIcon from "@mui/icons-material/Edit";

import { AppDialog } from "@/components/AppDialog";
import { MonoText } from "@/components/MonoText";
import { PageShell } from "@/components/PageShell";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { RepairOrderDetailTabs } from "@/features/repair-orders/components/RepairOrderDetailTabs";
import { useRepairOrder } from "@/features/repair-orders/hooks/useRepairOrder";
import { STATUS_META } from "@/features/repair-orders/statusMeta";

import type { ReactNode } from "react";

export default function RepairOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, error, refetch, updateTitle } = useRepairOrder(Number(id));

  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const handleOpenEditTitle = () => {
    setTitleDraft(order?.title ?? "");
    setTitleDialogOpen(true);
  };

  const handleSaveTitle = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) return;
    setSavingTitle(true);
    try {
      await updateTitle({ title: trimmed });
      setTitleDialogOpen(false);
    } finally {
      setSavingTitle(false);
    }
  };

  if (loading && !order) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  const meta = order ? STATUS_META[order.status] : null;

  return (
    <PageShell title={`Orden de trabajo #${id}`}>
      {order && meta && (
        <Stack spacing={2} sx={{ mb: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: meta.color,
                color: "#FFFFFF",
              }}
            >
              <MonoText sx={{ fontSize: "0.8125rem", fontWeight: 700 }}>OT-{order.id}</MonoText>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {order.title ?? `Orden de trabajo #${id}`}
                </Typography>
                <IconButton
                  size="small"
                  aria-label="Editar título"
                  onClick={handleOpenEditTitle}
                  sx={{ flexShrink: 0 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            <StatusBadge tone={meta.tone} label={meta.label} sx={{ flexShrink: 0 }} />
          </Stack>

          <Panel title="Cliente y vehículo">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FieldRow label="Cliente">
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {`${order.clientFirstName} ${order.clientLastName}`}
                  </Typography>
                </FieldRow>
                <FieldRow label="Teléfono">
                  <MonoText sx={{ fontSize: "0.8125rem" }}>{order.clientPhone || "—"}</MonoText>
                </FieldRow>
                <FieldRow label="DNI">
                  <MonoText sx={{ fontSize: "0.8125rem" }}>{order.clientDni || "—"}</MonoText>
                </FieldRow>
                <FieldRow label="Email">
                  <Typography variant="body2" noWrap>
                    {order.clientEmail || "—"}
                  </Typography>
                </FieldRow>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FieldRow label="Vehículo">
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {[order.vehicleYear, order.vehicleBrandName, order.vehicleModel]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </Typography>
                </FieldRow>
                <FieldRow label="Patente">
                  <MonoText sx={{ fontSize: "0.8125rem" }}>{order.vehiclePlate}</MonoText>
                </FieldRow>
                <FieldRow label="VIN">
                  <MonoText sx={{ fontSize: "0.8125rem" }}>
                    {order.vehicleChassisNumber || "—"}
                  </MonoText>
                </FieldRow>
              </Grid>
            </Grid>
          </Panel>
        </Stack>
      )}

      <RepairOrderDetailTabs order={order} loading={loading} onRefetch={refetch} />

      <AppDialog
        open={titleDialogOpen}
        title="Editar título"
        subtitle={`Orden de trabajo #${id}`}
        onClose={() => setTitleDialogOpen(false)}
        icon={<EditIcon sx={{ fontSize: "1.25rem" }} />}
        actions={
          <>
            <Button color="inherit" onClick={() => setTitleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              disabled={!titleDraft.trim() || savingTitle}
              onClick={handleSaveTitle}
            >
              {savingTitle ? "Guardando…" : "Guardar"}
            </Button>
          </>
        }
      >
        <TextField
          label="Título"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          fullWidth
          autoFocus
          inputProps={{ maxLength: 255 }}
          helperText="Máximo 255 caracteres"
        />
      </AppDialog>
    </PageShell>
  );
}

interface FieldRowProps {
  label: string;
  children: ReactNode;
}

function FieldRow({ label, children }: FieldRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 2,
        py: 0.75,
      }}
    >
      <Typography variant="overline" sx={{ color: "text.faint", flex: "none" }}>
        {label}
      </Typography>
      <Box
        sx={{
          minWidth: 0,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
