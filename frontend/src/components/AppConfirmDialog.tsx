import { Button, CircularProgress, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { AppDialog } from "./AppDialog";

import type { ReactNode } from "react";
import type { StatusTone } from "@/theme/tokens";

interface AppConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconTone?: StatusTone;
  confirmColor?: "primary" | "error" | "warning" | "success" | "info";
  className?: string;
}

export function AppConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
  icon,
  iconTone,
  confirmColor,
  className,
}: AppConfirmDialogProps) {
  const resolvedIcon =
    icon ??
    (destructive ? (
      <DeleteOutlineIcon sx={{ fontSize: "1.25rem" }} />
    ) : (
      <HelpOutlineIcon sx={{ fontSize: "1.25rem" }} />
    ));

  return (
    <AppDialog
      open={open}
      title={title}
      onClose={onCancel}
      className={className}
      icon={resolvedIcon}
      iconTone={iconTone ?? (destructive ? "bad" : undefined)}
      actions={
        <>
          <Button
            onClick={onCancel}
            color="inherit"
            disabled={loading}
            sx={{
              px: 0,
              color: "text.secondary",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              "&:hover": {
                backgroundColor: "transparent",
                color: "text.primary",
                textDecoration: "underline",
              },
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            color={confirmColor ?? (destructive ? "error" : "primary")}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Typography variant="body1" sx={{ color: "text.secondary" }}>
        {message}
      </Typography>
    </AppDialog>
  );
}
