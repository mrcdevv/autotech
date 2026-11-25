import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import { REPORT_PERIOD_OPTIONS } from "@/features/dashboard/utils/reportPeriod";

import type { ReportPeriodPreset } from "@/features/dashboard/utils/reportPeriod";

interface ReportPeriodFilterProps {
  preset: ReportPeriodPreset;
  customFrom: string;
  customTo: string;
  onPresetChange: (preset: ReportPeriodPreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}

export function ReportPeriodFilter({
  preset,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
}: ReportPeriodFilterProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ xs: "stretch", sm: "center" }}
      useFlexGap
      flexWrap="wrap"
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        aria-label="Período"
        value={preset}
        // A click on the selected option sends null: keep the current period.
        onChange={(_, value: ReportPeriodPreset | null) => value && onPresetChange(value)}
        sx={{ flexWrap: "wrap", bgcolor: "background.paper" }}
      >
        {REPORT_PERIOD_OPTIONS.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            sx={{
              px: 1.75,
              textTransform: "none",
              fontWeight: 500,
              "&.Mui-selected, &.Mui-selected:hover": {
                bgcolor: "text.primary",
                color: "background.paper",
              },
            }}
          >
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {preset === "custom" && (
        <Stack direction="row" spacing={1.5}>
          <DatePicker
            label="Desde"
            value={customFrom ? dayjs(customFrom) : null}
            maxDate={customTo ? dayjs(customTo) : undefined}
            onChange={(value) => value?.isValid() && onCustomFromChange(value.format("YYYY-MM-DD"))}
            slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
          />
          <DatePicker
            label="Hasta"
            value={customTo ? dayjs(customTo) : null}
            minDate={customFrom ? dayjs(customFrom) : undefined}
            onChange={(value) => value?.isValid() && onCustomToChange(value.format("YYYY-MM-DD"))}
            slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
          />
        </Stack>
      )}
    </Stack>
  );
}
