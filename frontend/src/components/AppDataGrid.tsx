import { Box, Typography } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { DataGrid } from "@mui/x-data-grid";

import type { DataGridProps, GridValidRowModel } from "@mui/x-data-grid";
import type { SxProps, Theme } from "@mui/material";

interface AppDataGridProps<R extends GridValidRowModel> extends DataGridProps<R> {
  emptyMessage?: string;
  minHeight?: number;
  desktopHeight?: string;
}

export function AppDataGrid<R extends GridValidRowModel>({
  emptyMessage = "No hay registros para mostrar.",
  minHeight = 460,
  desktopHeight = "calc(100vh - 220px)",
  pageSizeOptions = [12, 24, 48],
  disableRowSelectionOnClick = true,
  slots,
  sx,
  ...props
}: AppDataGridProps<R>) {
  const NoRowsOverlay = () => (
    <Box
      sx={{
        height: "100%",
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "text.secondary",
        gap: 1,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 40, color: "text.disabled" }} />
      <Typography variant="body2">{emptyMessage}</Typography>
    </Box>
  );

  const gridSx: SxProps<Theme> = [
    {
      minWidth: 0,
      "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
        outline: "none",
      },
      "& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within": {
        outline: "1px solid",
        outlineColor: "primary.main",
        outlineOffset: -1,
      },
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight,
        height: { xs: minHeight, lg: desktopHeight },
      }}
    >
      <DataGrid
        {...props}
        pageSizeOptions={pageSizeOptions}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        slots={{ noRowsOverlay: NoRowsOverlay, ...slots }}
        sx={gridSx}
      />
    </Box>
  );
}
