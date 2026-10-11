import { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import MiscellaneousServicesOutlinedIcon from "@mui/icons-material/MiscellaneousServicesOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import { useAuth } from "@/features/auth/context/AuthContext";
import { initials } from "@/utils/initials";
import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

export const SIDEBAR_WIDTH = 232;
export const SIDEBAR_COLLAPSED_WIDTH = 62;

const EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const EXPAND_MS = 170;
const COLLAPSE_MS = 190;
const LABEL_MS = 130;

const ICON_SIZE = "1.375rem";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "",
    items: [{ label: "Inicio", path: "/", icon: <HomeOutlinedIcon /> }],
  },
  {
    title: "Taller",
    items: [
      { label: "Órdenes de trabajo", path: "/ordenes-trabajo", icon: <HandymanOutlinedIcon /> },
      { label: "Calendario", path: "/calendario", icon: <CalendarMonthOutlinedIcon /> },
      { label: "Presupuestos", path: "/presupuestos", icon: <RequestQuoteOutlinedIcon /> },
      { label: "Facturas", path: "/facturas", icon: <ReceiptOutlinedIcon /> },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { label: "Servicios", path: "/servicios", icon: <MiscellaneousServicesOutlinedIcon /> },
      { label: "Productos", path: "/productos", icon: <Inventory2OutlinedIcon /> },
      { label: "Paquetes de servicios", path: "/paquetes-de-servicios", icon: <LayersOutlinedIcon /> },
    ],
  },
  {
    title: "Administración",
    items: [
      { label: "Clientes", path: "/clientes", icon: <PeopleOutlinedIcon /> },
      { label: "Vehículos", path: "/vehiculos", icon: <DirectionsCarOutlinedIcon /> },
      { label: "Empleados", path: "/empleados", icon: <BadgeOutlinedIcon /> },
      { label: "Reportes", path: "/reportes", icon: <BarChartOutlinedIcon /> },
    ],
  },
];

const bottomNavItem: NavItem = {
  label: "Configuración",
  path: "/configuracion",
  icon: <SettingsOutlinedIcon />,
};

const CASCADE_STEP_MS = 20;
const CASCADE_MAX_STEPS = 5;

const navOrder = new Map<string, number>();
navSections.forEach((section) =>
  section.items.forEach((item) => navOrder.set(item.path, navOrder.size))
);
navOrder.set(bottomNavItem.path, navOrder.size);

function cascadeDelay(path: string): number {
  return Math.min(navOrder.get(path) ?? 0, CASCADE_MAX_STEPS) * CASCADE_STEP_MS;
}

interface RevealProps {
  expanded: boolean;
  delay?: number;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

function Reveal({ expanded, delay = 0, children, sx }: RevealProps) {
  const cascade = expanded ? delay : 0;

  return (
    <Box
      component="span"
      aria-hidden={!expanded}
      sx={[
        {
          display: "block",
          minWidth: 0,
          whiteSpace: "nowrap",
          opacity: expanded ? 1 : 0,
          transform: expanded ? "translateX(0)" : "translateX(-8px)",
          transition:
            `opacity ${LABEL_MS}ms ease ${cascade}ms, ` +
            `transform ${EXPAND_MS}ms ${EASING} ${cascade}ms`,
          pointerEvents: expanded ? "auto" : "none",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const keyboardMode = useRef(false);

  useEffect(() => {
    const markKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Tab") keyboardMode.current = true;
    };
    const markPointer = () => {
      keyboardMode.current = false;
    };

    window.addEventListener("keydown", markKeyboard, true);
    window.addEventListener("pointerdown", markPointer, true);
    return () => {
      window.removeEventListener("keydown", markKeyboard, true);
      window.removeEventListener("pointerdown", markPointer, true);
    };
  }, []);

  const expanded = isMobile || hovered || focused || Boolean(anchorEl);

  const handleFocus = () => {
    if (keyboardMode.current) setFocused(true);
  };

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setFocused(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleChangePassword = () => {
    handleCloseMenu();
    navigate("/change-password");
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate("/login", { replace: true });
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <ListItemButton
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        title={expanded ? undefined : item.label}
        sx={{
          borderLeft: "3px solid",
          borderColor: active ? "primary.main" : "transparent",
          borderRadius: 0,
          py: "9px",
          pr: "10px",
          pl: expanded ? "13px" : "18px",
          gap: "10px",
          color: active ? "shell.textActive" : "shell.text",
          bgcolor: active ? "shell.activeBg" : "transparent",
          transition: `padding-left ${EXPAND_MS}ms ${EASING}, background-color 160ms ease, color 160ms ease`,
          "&:hover": {
            bgcolor: active ? "shell.activeBg" : "shell.hover",
            color: "shell.textActive",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            width: 22,
            height: 22,
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: active ? "primary.main" : "shell.icon",
            "& .MuiSvgIcon-root": { fontSize: ICON_SIZE },
          }}
        >
          {item.icon}
        </ListItemIcon>
        <Reveal expanded={expanded} delay={cascadeDelay(item.path)}>
          <Typography
            component="span"
            sx={{
              fontSize: "0.84375rem",
              fontWeight: active ? 600 : 400,
              color: "inherit",
              lineHeight: 1.4,
            }}
          >
            {item.label}
          </Typography>
        </Reveal>
      </ListItemButton>
    );
  };

  const renderSection = (section: NavSection, index: number) => (
    <Box key={section.title || index} sx={{ mb: "10px" }}>
      <Reveal expanded={expanded && Boolean(section.title)}>
        <Typography
          sx={{
            fontSize: "0.65625rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "shell.icon",
            px: "16px",
            pt: "8px",
            pb: "4px",
          }}
        >
          {section.title}
        </Typography>
      </Reveal>
      <List disablePadding>{section.items.map(renderNavItem)}</List>
    </Box>
  );

  const userInitials = user ? initials(user.firstName, user.lastName) : "U";

  const content = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "shell.bg",
        pb: "16px",
        overflowX: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "11px",
          px: "17px",
          pt: "16px",
          pb: "14px",
          minHeight: 58,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            flex: "none",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            clipPath: "polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)",
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: "primary.contrastText" }}>
            A
          </Typography>
        </Box>
        <Reveal expanded={expanded}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "0.9375rem",
              letterSpacing: "0.14em",
              lineHeight: 1.1,
              color: "shell.textActive",
            }}
          >
            AUTOTECH
          </Typography>
          <Typography
            sx={{
              fontSize: "0.6875rem",
              letterSpacing: "0.08em",
              lineHeight: 1.3,
              color: "shell.icon",
            }}
          >
            TALLER CENTRAL · CBA
          </Typography>
        </Reveal>
        {isMobile && (
          <IconButton onClick={onClose} size="small" sx={{ ml: "auto", color: "shell.text" }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box
        component="nav"
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "shell.scrollThumb", borderRadius: "3px" },
          scrollbarWidth: "thin",
        }}
      >
        {navSections.map(renderSection)}
      </Box>

      <List disablePadding sx={{ flex: "none" }}>
        {renderNavItem(bottomNavItem)}
      </List>

      <Box
        onClick={handleOpenMenu}
        title="Cuenta"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          mt: "10px",
          mx: "8px",
          px: "6px",
          pt: "10px",
          borderTop: "1px solid",
          borderColor: "shell.divider",
          cursor: "pointer",
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            flex: "none",
            bgcolor: "shell.avatarBg",
            border: "1px solid",
            borderColor: "shell.border",
            color: "shell.textActive",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: "3px",
          }}
        >
          {userInitials}
        </Box>
        <Reveal expanded={expanded}>
          <Typography
            sx={{
              fontSize: "0.78125rem",
              fontWeight: 600,
              color: "shell.textActive",
              lineHeight: 1.2,
            }}
          >
            {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
          </Typography>
          <Typography sx={{ fontSize: "0.6875rem", color: "shell.icon", lineHeight: 1.3 }}>
            {user?.email}
          </Typography>
        </Reveal>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
        slotProps={{ paper: { sx: { mb: 1, minWidth: 200 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleChangePassword}>
          <ListItemIcon>
            <LockOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Cambiar contraseña
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, border: "none", bgcolor: "shell.bg" } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box
      component="aside"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      sx={{
        flex: "none",
        width: expanded ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        overflow: "hidden",
        bgcolor: "shell.bg",
        transition: `width ${expanded ? EXPAND_MS : COLLAPSE_MS}ms ${EASING}`,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        "@media print": { display: "none" },
      }}
    >
      {content}
    </Box>
  );
}
