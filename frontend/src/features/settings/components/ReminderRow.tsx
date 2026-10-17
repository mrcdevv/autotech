import { Box, FormControlLabel, Switch, TextField, Typography } from "@mui/material";

interface ReminderRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  disabled?: boolean;
  threshold?: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
  };
}

/** One reminder type: on/off switch plus an optional numeric threshold. */
export function ReminderRow({ label, description, enabled, onEnabledChange, disabled = false, threshold }: ReminderRowProps) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, py: 1.5, borderTop: 1, borderColor: "divider" }}>
      <Box sx={{ flex: "1 1 260px", minWidth: 0 }}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} disabled={disabled} />}
          label={label}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
          {description}
        </Typography>
      </Box>
      {threshold && (
        <TextField
          label={threshold.label}
          type="number"
          size="small"
          value={threshold.value}
          onChange={(e) => threshold.onChange(Number(e.target.value))}
          disabled={disabled || !enabled}
          error={threshold.value < threshold.min || threshold.value > threshold.max}
          helperText={`Entre ${threshold.min} y ${threshold.max}`}
          slotProps={{ htmlInput: { min: threshold.min, max: threshold.max } }}
          sx={{ width: 170 }}
        />
      )}
    </Box>
  );
}
