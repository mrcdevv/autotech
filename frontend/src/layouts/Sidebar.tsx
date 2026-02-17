import { useLocation, useNavigate } from "react-router";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import MiscellaneousServicesOutlinedIcon from "@mui/icons-material/MiscellaneousServicesOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

export const SIDEBAR_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { label: "Inicio", path: "/", icon: <DashboardOutlinedIcon /> },
    ],
  },
  {
    title: "Taller",
    items: [
      { label: "Ordenes de trabajo", path: "/ordenes-trabajo", icon: <HandymanOutlinedIcon /> },
      { label: "Calendario", path: "/calendario", icon: <CalendarMonthOutlinedIcon /> },
      { label: "Presupuestos", path: "/presupuestos", icon: <RequestQuoteOutlinedIcon /> },
      { label: "Facturas", path: "/facturas", icon: <ReceiptOutlinedIcon /> },
    ],
  },
  {
    title: "Directorio",
    items: [
      { label: "Clientes", path: "/clientes", icon: <PeopleOutlinedIcon /> },
      { label: "Vehiculos", path: "/vehiculos", icon: <DirectionsCarOutlinedIcon /> },
      { label: "Empleados", path: "/empleados", icon: <BadgeOutlinedIcon /> },
    ],
  },
  {
    title: "Catalogo",
    items: [
      { label: "Servicios", path: "/servicios", icon: <MiscellaneousServicesOutlinedIcon /> },
      { label: "Productos", path: "/productos", icon: <Inventory2OutlinedIcon /> },
      { label: "Trabajos enlatados", path: "/trabajos-enlatados", icon: <PlaylistAddCheckOutlinedIcon /> },
    ],
  },
  {
    title: "Administracion",
    items: [
      { label: "Reportes", path: "/reportes", icon: <AssessmentOutlinedIcon /> },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { label: "Configuracion", path: "/configuracion", icon: <SettingsOutlinedIcon /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <ListItemButton
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        sx={{
          borderRadius: 1.5,
          mx: 1,
          mb: "2px",
          px: 1.5,
          py: "6px",
          minHeight: 36,
          color: active ? "sidebar.active" : "sidebar.text",
          bgcolor: active ? "sidebar.activeBg" : "transparent",
          "&:hover": {
            bgcolor: active ? "sidebar.activeBg" : "sidebar.hover",
          },
          transition: "all 0.15s ease",
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 32,
            color: active ? "#93C5FD" : "sidebar.icon",
            "& .MuiSvgIcon-root": { fontSize: "1.15rem" },
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontSize: "0.8125rem",
            fontWeight: active ? 600 : 400,
            color: "inherit",
            lineHeight: 1.4,
          }}
        />
      </ListItemButton>
    );
  };

  const renderSection = (section: NavSection, index: number) => (
    <Box key={section.title || index}>
      {section.title && (
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "sidebar.textMuted",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            px: 2.5,
            pt: index === 0 ? 0 : 1.5,
            pb: 0.5,
          }}
        >
          {section.title}
        </Typography>
      )}
      <List disablePadding>
        {section.items.map(renderNavItem)}
      </List>
    </Box>
  );

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "sidebar.bg",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          minHeight: 56,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <BuildOutlinedIcon sx={{ color: "#93C5FD", fontSize: 22 }} />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            Autotech
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose} size="small" sx={{ color: "sidebar.textMuted" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "sidebar.divider" }} />

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          pt: 1,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
          },
        }}
      >
        {navSections.map(renderSection)}
      </Box>

      <Divider sx={{ borderColor: "sidebar.divider" }} />

      <Box sx={{ py: 1 }}>
        <List disablePadding>
          {bottomNavItems.map(renderNavItem)}
        </List>
      </Box>
    </Box>
  );

  const drawerPaperSx = {
    width: SIDEBAR_WIDTH,
    border: "none",
    boxShadow: "none",
    backgroundImage: "none",
    bgcolor: "sidebar.bg",
  };

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ "& .MuiDrawer-paper": drawerPaperSx }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": drawerPaperSx,
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
