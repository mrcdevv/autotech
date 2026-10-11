import { MenuItem, Stack, TextField } from "@mui/material";
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
      spacing={2}
      alignItems={{ xs: "stretch", sm: "center" }}
    >
      <TextField
        select
        size="small"
        label="Período"
        value={preset}
        onChange={(event) => onPresetChange(event.target.value as ReportPeriodPreset)}
        sx={{ minWidth: 200 }}
      >
        {REPORT_PERIOD_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {preset === "custom" && (
        <>
          <DatePicker
            label="Desde"
            value={customFrom ? dayjs(customFrom) : null}
            onChange={(value) => value && onCustomFromChange(value.format("YYYY-MM-DD"))}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="Hasta"
            value={customTo ? dayjs(customTo) : null}
            onChange={(value) => value && onCustomToChange(value.format("YYYY-MM-DD"))}
            slotProps={{ textField: { size: "small" } }}
          />
        </>
      )}
    </Stack>
  );
}
