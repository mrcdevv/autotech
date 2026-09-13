import SearchIcon from "@mui/icons-material/Search";
import { InputAdornment, TextField } from "@mui/material";

import type { TextFieldProps } from "@mui/material";

type AppSearchFieldProps = Omit<TextFieldProps, "size" | "variant">;

export function AppSearchField({ sx, ...props }: AppSearchFieldProps) {
  return (
    <TextField
      {...props}
      size="small"
      variant="outlined"
      slotProps={{
        ...props.slotProps,
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          ...props.slotProps?.input,
        },
      }}
      sx={[
        { minWidth: 300, width: { xs: "100%", md: 320 } },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}
