import { Box, Skeleton, Typography } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { DataGrid } from "@mui/x-data-grid";

import type { DataGridProps, GridValidRowModel } from "@mui/x-data-grid";
import type { SxProps, Theme } from "@mui/material";

interface AppDataGridProps<R extends GridValidRowModel> extends DataGridProps<R> {
  emptyMessage?: string;
  minHeight?: number;
  desktopHeight?: string;
}

const ROW_HEIGHT = 48;
const GRID_CHROME = 44 + 52;
const MIN_VISIBLE_ROWS = 3;

export function AppDataGrid<R extends GridValidRowModel>({
  emptyMessage = "No hay registros para mostrar.",
  minHeight = 200,
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
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "text.secondary",
        gap: 1,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 36, color: "text.disabled" }} />
      <Typography variant="body2">{emptyMessage}</Typography>
    </Box>
  );

  const LoadingOverlay = () => (
    <Box
      data-testid="grid-loading"
      role="status"
      aria-label="Cargando"
      sx={{ width: "100%", px: 1.5, py: 1 }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={28}
          sx={{ my: "5px", borderRadius: "4px", bgcolor: "rgba(29, 31, 36, 0.05)" }}
        />
      ))}
    </Box>
  );

  const rowCount = props.rows?.length ?? 0;
  const visibleRows = Math.max(rowCount, MIN_VISIBLE_ROWS);
  const contentHeight = GRID_CHROME + visibleRows * ROW_HEIGHT + 2;
  const height = `min(${contentHeight}px, ${desktopHeight})`;

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
        height: { xs: minHeight, lg: height },
      }}
    >
      <DataGrid
        {...props}
        pageSizeOptions={pageSizeOptions}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        slots={{ noRowsOverlay: NoRowsOverlay, loadingOverlay: LoadingOverlay, ...slots }}
        sx={gridSx}
      />
    </Box>
  );
}
