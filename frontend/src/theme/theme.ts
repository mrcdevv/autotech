import { createTheme } from "@mui/material/styles";
import { esES as materialEsES } from "@mui/material/locale";
import { esES as dataGridEsES } from "@mui/x-data-grid/locales";
import { esES as datePickersEsES } from "@mui/x-date-pickers/locales";

import type {} from "@mui/x-data-grid/themeAugmentation";

import { border, brand, dot, font, grey, radius, shadow, shell, status, surface, text } from "./tokens";

declare module "@mui/material/styles" {
  interface Palette {
    shell: {
      bg: string;
      hover: string;
      activeBg: string;
      text: string;
      textActive: string;
      icon: string;
      iconActive: string;
      divider: string;
      border: string;
      avatarBg: string;
    };
    status: {
      warn: { bg: string; fg: string };
      parts: { bg: string; fg: string };
      ok: { bg: string; fg: string };
      done: { bg: string; fg: string };
      bad: { bg: string; fg: string };
      info: { bg: string; fg: string };
      testing: { bg: string; fg: string };
      neutral: { bg: string; fg: string };
    };
    dot: {
      warn: string;
      parts: string;
      ok: string;
      done: string;
      bad: string;
      info: string;
      testing: string;
      neutral: string;
    };
  }
  interface PaletteOptions {
    shell?: {
      bg?: string;
      hover?: string;
      activeBg?: string;
      text?: string;
      textActive?: string;
      icon?: string;
      iconActive?: string;
      divider?: string;
      border?: string;
      avatarBg?: string;
    };
    status?: {
      warn?: { bg: string; fg: string };
      parts?: { bg: string; fg: string };
      ok?: { bg: string; fg: string };
      done?: { bg: string; fg: string };
      bad?: { bg: string; fg: string };
      info?: { bg: string; fg: string };
      testing?: { bg: string; fg: string };
      neutral?: { bg: string; fg: string };
    };
    dot?: {
      warn?: string;
      parts?: string;
      ok?: string;
      done?: string;
      bad?: string;
      info?: string;
      testing?: string;
      neutral?: string;
    };
  }
}

const theme = createTheme(
  {
    palette: {
      primary: {
        main: brand.accent,
        light: "#FF9647",
        dark: brand.accentHover,
        contrastText: brand.accentInk,
      },
      secondary: {
        main: text.primary,
        light: grey[700],
        dark: "#000000",
        contrastText: surface.base,
      },
      success: {
        main: status.ok.fg,
        light: "#2E8C57",
        dark: "#144D2E",
        contrastText: surface.base,
      },
      error: {
        main: status.bad.fg,
        light: "#C24E33",
        dark: "#7C2A18",
        contrastText: surface.base,
      },
      warning: {
        main: status.warn.fg,
        light: "#9C7415",
        dark: "#5A400A",
        contrastText: surface.base,
      },
      info: {
        main: status.info.fg,
        light: "#4276C9",
        dark: "#1F4482",
        contrastText: surface.base,
      },
      background: {
        default: surface.canvas,
        paper: surface.base,
      },
      text: {
        primary: text.primary,
        secondary: text.secondary,
        disabled: text.disabled,
      },
      divider: border.base,
      action: {
        hover: "rgba(29, 31, 36, 0.03)",
        selected: "rgba(255, 122, 26, 0.08)",
        disabled: text.disabled,
        disabledBackground: border.divider,
        focus: "rgba(255, 122, 26, 0.28)",
        active: text.secondary,
        hoverOpacity: 0.03,
        selectedOpacity: 0.08,
      },
      grey,
      shell,
      status,
      dot,
    },
    typography: {
      fontFamily: font.sans,
      fontSize: 14,
      h1: { fontWeight: 650, fontSize: "1.75rem", lineHeight: 1.25, letterSpacing: "-0.02em", color: text.primary },
      h2: { fontWeight: 650, fontSize: "1.5rem", lineHeight: 1.3, letterSpacing: "-0.02em", color: text.primary },
      h3: { fontWeight: 650, fontSize: "1.25rem", lineHeight: 1.35, letterSpacing: "-0.01em", color: text.primary },
      h4: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4, color: text.primary },
      h5: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.45, color: text.primary },
      h6: { fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.5, color: text.primary },
      subtitle1: { fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5, color: text.primary },
      subtitle2: { fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.5, color: text.primary },
      body1: { fontSize: "0.875rem", lineHeight: 1.6, color: text.muted },
      body2: { fontSize: "0.8125rem", lineHeight: 1.5, color: text.muted },
      caption: { fontSize: "0.75rem", lineHeight: 1.5, color: text.secondary },
      overline: {
        fontSize: "0.65625rem",
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase" as const,
        lineHeight: 1.4,
        color: text.secondary,
      },
      button: { fontWeight: 600, fontSize: "0.8125rem", textTransform: "none" as const },
    },
    shape: {
      borderRadius: radius.sm,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: surface.canvas,
            color: text.primary,
            WebkitFontSmoothing: "antialiased",
          },
          a: {
            color: text.primary,
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            fontWeight: 500,
          },
          "a:hover": {
            color: brand.accentDeep,
          },
          "@media print": {
            "@page": {
              margin: "15mm",
            },
            ".no-print, header, footer, nav, aside, .MuiDrawer-root, .MuiAppBar-root, button, .MuiTabs-root": {
              display: "none !important",
            },
            main: {
              margin: "0 !important",
              padding: "0 !important",
              width: "100% !important",
              minWidth: "100% !important",
              position: "static !important",
            },
            "#root": {
              padding: "0 !important",
            },
            ".MuiPaper-root": {
              boxShadow: "none !important",
              border: "none !important",
              padding: "0 !important",
            },
            body: {
              backgroundColor: "#fff !important",
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: radius.sm,
            fontSize: "0.8125rem",
            boxShadow: shadow.none,
            padding: "7px 16px",
            "&:hover": { boxShadow: shadow.none },
          },
          containedPrimary: {
            color: brand.accentInk,
            "&:hover": { backgroundColor: brand.accentHover },
          },
          outlined: {
            borderColor: border.strong,
            color: text.primary,
            "&:hover": { borderColor: grey[400], backgroundColor: "rgba(29, 31, 36, 0.03)" },
          },
          sizeSmall: { padding: "5px 12px", fontSize: "0.75rem" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none", borderRadius: radius.sm },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            border: `1px solid ${border.base}`,
            boxShadow: shadow.none,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 16, "&:last-child": { paddingBottom: 16 } },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: "none", boxShadow: shadow.none },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundImage: "none" },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: "0.6875rem", borderRadius: radius.sm, height: 22 },
          label: { paddingLeft: 8, paddingRight: 8 },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-head": {
              fontWeight: 600,
              fontSize: "0.6875rem",
              color: text.secondary,
              backgroundColor: surface.sunken,
              borderBottom: `1px solid ${border.base}`,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            color: text.muted,
            borderBottom: `1px solid ${border.divider}`,
            padding: "10px 16px",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { "&:hover": { backgroundColor: surface.raised } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            fontSize: "0.8125rem",
            backgroundColor: surface.base,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: border.strong },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: grey[400] },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: text.primary,
              borderWidth: "1px",
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: "0.8125rem", color: text.secondary },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
            minHeight: 40,
            padding: "8px 16px",
            color: text.secondary,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          indicator: { height: 2, backgroundColor: brand.accent },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: radius.sm, fontSize: "0.8125rem" },
          standardSuccess: { backgroundColor: status.ok.bg, color: status.ok.fg },
          standardError: { backgroundColor: status.bad.bg, color: status.bad.fg },
          standardWarning: { backgroundColor: status.warn.bg, color: status.warn.fg },
          standardInfo: { backgroundColor: status.info.bg, color: status.info.fg },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: "0.75rem", borderRadius: radius.sm, backgroundColor: grey[800] },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: radius.md, border: `1px solid ${border.base}` },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { borderRadius: radius.sm, border: `1px solid ${border.base}`, boxShadow: shadow.raised },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { backgroundColor: "rgba(29, 31, 36, 0.06)" },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: border.divider },
        },
      },
      MuiDataGrid: {
        defaultProps: {
          rowHeight: 48,
          columnHeaderHeight: 44,
        },
        styleOverrides: {
          root: {
            backgroundColor: surface.base,
            border: `1px solid ${border.base}`,
            borderRadius: radius.md,
            overflow: "hidden",
            "--DataGrid-containerBackground": surface.sunken,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: surface.sunken,
              borderBottom: `1px solid ${border.base}`,
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
              fontSize: "0.6875rem",
              color: text.secondary,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            },
            "& .MuiDataGrid-columnHeader--sorted": {
              position: "relative",
            },
            "& .MuiDataGrid-columnHeader--sorted::after": {
              content: '""',
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              backgroundColor: brand.accent,
            },
            "& .MuiDataGrid-sortIcon": { color: brand.accent },
            "& .MuiDataGrid-menuIcon": { color: text.secondary },
            "& .MuiDataGrid-iconSeparator": { display: "none" },
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${border.divider}`,
              color: text.muted,
              fontSize: "0.8125rem",
            },
            "& .MuiDataGrid-row": {
              position: "relative",
              transition: "background-color 0.15s ease",
            },
            "& .MuiDataGrid-row::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: "transparent",
              transition: "background-color 0.15s ease",
              zIndex: 1,
            },
            "& .MuiDataGrid-row:hover": { backgroundColor: surface.raised },
            "& .MuiDataGrid-row:hover::before": { backgroundColor: brand.accent },
            "& .MuiDataGrid-row--lastVisible .MuiDataGrid-cell": {
              borderBottom: "none",
            },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${border.base}`,
              backgroundColor: surface.base,
              minHeight: 48,
              justifyContent: "flex-end",
            },
            "& .MuiTablePagination-root": {
              fontSize: "0.8125rem",
              color: text.secondary,
            },
            "& .MuiDataGrid-overlay": {
              backgroundColor: surface.base,
            },
          },
        },
      },
    },
  },
  materialEsES,
  dataGridEsES,
  datePickersEsES
);

export default theme;
