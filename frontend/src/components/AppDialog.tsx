import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import type { ReactNode } from "react";
import type { DialogProps } from "@mui/material";
import type { StatusTone } from "@/theme/tokens";

interface AppDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  iconTone?: StatusTone;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
  className?: string;
}

export function AppDialog({
  open,
  title,
  subtitle,
  onClose,
  children,
  actions,
  icon,
  iconTone,
  maxWidth = "sm",
  fullWidth = true,
  className,
}: AppDialogProps) {
  const iconBoxSx = iconTone
    ? { bgcolor: `status.${iconTone}.bg`, color: `status.${iconTone}.fg` }
    : { bgcolor: "action.selected", color: "primary.main" };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      className={className}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 12px 40px rgba(29, 31, 36, 0.12)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          p: "22px 24px 8px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...iconBoxSx,
            }}
          >
            {icon ?? <SettingsOutlinedIcon sx={{ fontSize: "1.25rem" }} />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ color: "text.primary" }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: "text.secondary", mt: "2px" }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary", mt: -0.25 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      {/* `!important` needed: MUI's DialogContent has a `.MuiDialogTitle-root + &` rule
          that forces `padding-top: 0` with higher specificity than `sx`, which clipped
          the floating label of the first field against the header. */}
      <DialogContent sx={{ px: "24px", pt: "20px !important" }}>{children}</DialogContent>
      {actions && (
        <DialogActions sx={{ px: "24px", pt: "20px", pb: "22px", gap: 1.5 }}>{actions}</DialogActions>
      )}
    </Dialog>
  );
}
