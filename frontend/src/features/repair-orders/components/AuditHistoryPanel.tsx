import { useEffect, useState } from "react";

import { Alert, Box, Chip, Divider, Stack, Typography } from "@mui/material";

import { auditLogsApi } from "@/api/auditLogs";
import { InfoList } from "@/components/InfoList";
import { Panel } from "@/components/Panel";

import type { AuditEntityType, AuditLogRow } from "@/types/auditLog";

const DEFAULT_TITLE = "Historial de cambios";
const NO_ACTOR_LABEL = "No registrado";
const LOAD_ERROR_MESSAGE = "No se pudo cargar el historial de cambios.";

interface AuditHistoryPanelProps {
  entityType: AuditEntityType;
  entityId: number;
  /** Panel heading; pass null in hosts that supply their own heading. */
  title?: string | null;
}

// The backend stores oldValues/newValues as raw JSON text. Parsing is isolated so a
// malformed payload degrades to the raw text instead of crashing the screen.
type ParsedValues =
  | { kind: "empty" }
  | { kind: "unparsable"; text: string }
  | { kind: "value"; value: unknown };

function parseValues(raw: string | null): ParsedValues {
  if (raw == null) return { kind: "empty" };
  try {
    return { kind: "value", value: JSON.parse(raw) };
  } catch {
    return { kind: "unparsable", text: raw };
  }
}

function toInfoItems(record: Record<string, unknown>) {
  return Object.entries(record).map(([key, value]) => ({
    label: key,
    value: value == null ? null : String(value),
  }));
}

function ChangeSide({ title, raw }: { title: string; raw: string | null }) {
  const parsed = parseValues(raw);

  let content: React.ReactNode;
  if (parsed.kind === "empty") {
    // A missing side renders as an em dash, never as a blank cell.
    content = <Typography variant="body1">—</Typography>;
  } else if (parsed.kind === "unparsable") {
    content = (
      <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
        {parsed.text}
      </Typography>
    );
  } else if (typeof parsed.value === "object" && parsed.value !== null) {
    content = <InfoList items={toInfoItems(parsed.value as Record<string, unknown>)} />;
  } else {
    content = <Typography variant="body1">{String(parsed.value)}</Typography>;
  }

  return (
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, display: "block" }}>
        {title}
      </Typography>
      {content}
    </Box>
  );
}

export function AuditHistoryPanel({ entityType, entityId, title = DEFAULT_TITLE }: AuditHistoryPanelProps) {
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    auditLogsApi
      .getByEntity(entityType, entityId)
      .then((res) => {
        if (!cancelled) setRows(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (error) {
    return <Alert severity="error">{LOAD_ERROR_MESSAGE}</Alert>;
  }

  // Loading and empty histories stay invisible: an empty history must not occupy the
  // page with an empty box.
  if (rows == null || rows.length === 0) return null;

  return (
    <Panel title={title ?? undefined}>
      <Stack divider={<Divider />} spacing={2}>
        {rows.map((row) => (
          <Box key={row.id}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
              <Chip label={row.action} size="small" />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {new Date(row.createdAt).toLocaleString("es-AR")}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Realizado por:{" "}
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {row.performedByEmployeeName ?? NO_ACTOR_LABEL}
              </Typography>
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1.5 }}>
              <ChangeSide title="Antes" raw={row.oldValues} />
              <ChangeSide title="Después" raw={row.newValues} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Panel>
  );
}
