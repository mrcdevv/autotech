import { Checkbox, FormControlLabel, FormHelperText, Stack } from "@mui/material";

import { NO_CLIENT_EMAIL_HINT } from "@/features/appointments/notifyClient";

interface NotifyClientCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  clientHasEmail: boolean;
  disabled?: boolean;
}

export function NotifyClientCheckbox({ checked, onChange, clientHasEmail, disabled = false }: NotifyClientCheckboxProps) {
  return (
    <Stack spacing={0}>
      <FormControlLabel
        control={
          <Checkbox
            checked={clientHasEmail && checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled || !clientHasEmail}
          />
        }
        label="Notificar al cliente por email"
      />
      {!clientHasEmail && <FormHelperText sx={{ mt: -0.5, ml: 4 }}>{NO_CLIENT_EMAIL_HINT}</FormHelperText>}
    </Stack>
  );
}
