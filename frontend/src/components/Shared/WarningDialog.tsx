import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { AppConfirmDialog } from "@/components/AppConfirmDialog";

import type { StatusTone } from "@/theme/tokens";

interface WarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  iconTone?: StatusTone;
}

export function WarningDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Aceptar",
  cancelLabel = "Rechazar",
  destructive = false,
  iconTone,
}: WarningDialogProps) {
  return (
    <AppConfirmDialog
      open={open}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      onCancel={onClose}
      destructive={destructive}
      iconTone={iconTone ?? (destructive ? undefined : "warn")}
      icon={<WarningAmberIcon sx={{ fontSize: "1.25rem" }} />}
    />
  );
}
