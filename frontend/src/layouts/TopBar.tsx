import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  InputBase,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { SIDEBAR_WIDTH } from "./Sidebar";

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: isMobile ? "100%" : `calc(100% - ${SIDEBAR_WIDTH}px)`,
        ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ minHeight: 56, px: { xs: 2, md: 3 }, gap: 1.5 }}>
        {isMobile && (
          <IconButton
            edge="start"
            onClick={onMenuToggle}
            sx={{ color: "text.secondary" }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "grey.50",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            width: { xs: "100%", sm: 280, md: 320 },
            transition: "border-color 0.2s",
            "&:focus-within": {
              borderColor: "primary.main",
            },
          }}
        >
          <SearchIcon sx={{ color: "grey.400", fontSize: "1.1rem", mr: 1 }} />
          <InputBase
            placeholder="Buscar..."
            sx={{
              fontSize: "0.8125rem",
              color: "text.primary",
              flex: 1,
              "& .MuiInputBase-input::placeholder": {
                color: "grey.400",
                opacity: 1,
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" sx={{ color: "grey.500" }}>
            <NotificationsNoneOutlinedIcon sx={{ fontSize: "1.25rem" }} />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              ml: 0.5,
              cursor: "pointer",
              borderRadius: 2,
              px: 1,
              py: 0.5,
              "&:hover": { bgcolor: "grey.50" },
              transition: "background-color 0.15s",
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: "primary.main",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              T
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography
                sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2, fontSize: "0.8125rem" }}
              >
                Taller
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.6875rem", lineHeight: 1.2 }}>
                Administrador
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
