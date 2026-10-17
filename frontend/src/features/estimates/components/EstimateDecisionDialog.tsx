import { useEffect, useState } from "react";

import { Button, FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import { AppDialog } from "@/components/AppDialog";
import { DECISION_CHANNEL_LABELS, STAFF_DECISION_CHANNELS } from "@/features/estimates/decisionChannel";

import type { StaffDecisionChannel } from "@/types/estimate";

interface EstimateDecisionDialogProps {
  open: boolean;
  decision: "approve" | "reject";
  onClose: () => void;
  onConfirm: (channel: StaffDecisionChannel) => Promise<void>;
}

export function EstimateDecisionDialog({ open, decision, onClose, onConfirm }: EstimateDecisionDialogProps) {
  const [channel, setChannel] = useState<StaffDecisionChannel | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setChannel(null);
  }, [open]);

  const isApprove = decision === "approve";

  const handleConfirm = async () => {
    if (!channel) return;
    setSaving(true);
    try {
      await onConfirm(channel);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={isApprove ? "Aprobar presupuesto" : "Rechazar presupuesto"}
      icon={<FactCheckOutlinedIcon sx={{ fontSize: "1.25rem" }} />}
      iconTone={isApprove ? "ok" : "bad"}
      actions={
        <>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={isApprove ? "success" : "error"}
            onClick={handleConfirm}
            disabled={!channel || saving}
          >
            {isApprove ? "Aprobar" : "Rechazar"}
          </Button>
        </>
      }
    >
      <Typography color="text.secondary" sx={{ mb: 1.5 }}>
        ¿Por qué medio {isApprove ? "aprobó" : "rechazó"} el cliente el presupuesto?
      </Typography>
      <RadioGroup
        aria-label="Medio de respuesta del cliente"
        value={channel ?? ""}
        onChange={(e) => setChannel(e.target.value as StaffDecisionChannel)}
      >
        {STAFF_DECISION_CHANNELS.map((option) => (
          <FormControlLabel key={option} value={option} control={<Radio />} label={DECISION_CHANNEL_LABELS[option]} />
        ))}
      </RadioGroup>
    </AppDialog>
  );
}
