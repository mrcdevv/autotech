import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    neutral: {
      main: string;
      light: string;
      lighter: string;
      dark: string;
      darker: string;
    };
    sidebar: {
      bg: string;
      text: string;
      textMuted: string;
      active: string;
      activeBg: string;
      hover: string;
      divider: string;
      icon: string;
    };
  }
  interface PaletteOptions {
    neutral?: {
      main?: string;
      light?: string;
      lighter?: string;
      dark?: string;
      darker?: string;
    };
    sidebar?: {
      bg?: string;
      text?: string;
      textMuted?: string;
      active?: string;
      activeBg?: string;
      hover?: string;
      divider?: string;
      icon?: string;
    };
  }
}

const fontFamily = '"Inter", "Helvetica", "Arial", sans-serif';

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563EB",
      light: "#3B82F6",
      dark: "#1D4ED8",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#7C3AED",
      light: "#A78BFA",
      dark: "#6D28D9",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#EF4444",
      light: "#F87171",
      dark: "#DC2626",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#F59E0B",
      light: "#FBBF24",
      dark: "#D97706",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#3B82F6",
      light: "#60A5FA",
      dark: "#2563EB",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      disabled: "#94A3B8",
    },
    divider: "#E2E8F0",
    action: {
      hover: "rgba(37, 99, 235, 0.04)",
      selected: "rgba(37, 99, 235, 0.08)",
      disabled: "#94A3B8",
      disabledBackground: "#E2E8F0",
      focus: "#CBD5E1",
      active: "#64748B",
      hoverOpacity: 0.04,
      selectedOpacity: 0.08,
    },
    grey: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
    neutral: {
      main: "#0F172A",
      light: "#475569",
      lighter: "#F1F5F9",
      dark: "#020617",
      darker: "#020617",
    },
    sidebar: {
      bg: "#0F172A",
      text: "#E2E8F0",
      textMuted: "#94A3B8",
      active: "#FFFFFF",
      activeBg: "rgba(37, 99, 235, 0.2)",
      hover: "rgba(255, 255, 255, 0.06)",
      divider: "rgba(255, 255, 255, 0.08)",
      icon: "#64748B",
    },
  },
  typography: {
    fontFamily,
    fontSize: 14,
    h1: { fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.3, letterSpacing: "-0.02em", color: "#0F172A" },
    h2: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.35, letterSpacing: "-0.01em", color: "#0F172A" },
    h3: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.4, letterSpacing: "-0.01em", color: "#0F172A" },
    h4: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4, color: "#0F172A" },
    h5: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.5, color: "#0F172A" },
    h6: { fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5, color: "#475569" },
    subtitle1: { fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5, color: "#0F172A" },
    subtitle2: { fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.5, color: "#0F172A" },
    body1: { fontSize: "0.875rem", lineHeight: 1.6, color: "#475569" },
    body2: { fontSize: "0.8125rem", lineHeight: 1.5, color: "#475569" },
    caption: { fontSize: "0.75rem", lineHeight: 1.5, color: "#64748B" },
    overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "#94A3B8" },
    button: { fontWeight: 600, fontSize: "0.8125rem", textTransform: "none" as const },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F8FAFC",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          fontSize: "0.8125rem",
          boxShadow: "none",
          padding: "6px 16px",
          "&:hover": { boxShadow: "none" },
        },
        sizeSmall: {
          padding: "4px 12px",
          fontSize: "0.75rem",
        },
        containedPrimary: {
          backgroundColor: "#2563EB",
          "&:hover": { backgroundColor: "#1D4ED8" },
        },
        outlinedPrimary: {
          borderColor: "#E2E8F0",
          color: "#334155",
          "&:hover": { borderColor: "#CBD5E1", backgroundColor: "rgba(37, 99, 235, 0.04)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
          borderRadius: 12,
          border: "1px solid #E2E8F0",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
          border: "1px solid #E2E8F0",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: "0.75rem",
          borderRadius: 6,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 600,
            fontSize: "0.75rem",
            color: "#64748B",
            backgroundColor: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          color: "#334155",
          borderBottom: "1px solid #F1F5F9",
          padding: "10px 16px",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: "0.8125rem",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#E2E8F0",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#CBD5E1",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563EB",
            borderWidth: "1.5px",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          color: "#64748B",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.8125rem",
          minHeight: 40,
          padding: "8px 16px",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        indicator: {
          height: 2,
          borderRadius: 1,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: "0.8125rem",
        },
        standardSuccess: {
          backgroundColor: "#F0FDF4",
          color: "#166534",
          border: "1px solid #BBF7D0",
        },
        standardError: {
          backgroundColor: "#FEF2F2",
          color: "#991B1B",
          border: "1px solid #FECACA",
        },
        standardWarning: {
          backgroundColor: "#FFFBEB",
          color: "#92400E",
          border: "1px solid #FDE68A",
        },
        standardInfo: {
          backgroundColor: "#EFF6FF",
          color: "#1E40AF",
          border: "1px solid #BFDBFE",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.75rem",
          borderRadius: 6,
          backgroundColor: "#1E293B",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(148, 163, 184, 0.12)",
        },
      },
    },

  },
});

export default theme;
