import { useLocation } from "react-router";
import { AppBar, Toolbar, IconButton, Typography, useTheme, useMediaQuery } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

export const TOPBAR_HEIGHT = 54;

const TITLES: { path: string; title: string }[] = [
  { path: "/ordenes-trabajo/nueva", title: "Nueva orden de trabajo" },
  { path: "/ordenes-trabajo", title: "Órdenes de trabajo" },
  { path: "/calendario", title: "Calendario" },
  { path: "/presupuestos/nuevo", title: "Nuevo presupuesto" },
  { path: "/presupuestos", title: "Presupuestos" },
  { path: "/facturas/nuevo", title: "Nueva factura" },
  { path: "/facturas", title: "Facturas" },
  { path: "/servicios", title: "Servicios" },
  { path: "/productos", title: "Productos" },
  { path: "/paquetes-de-servicios", title: "Paquetes de servicios" },
  { path: "/clientes", title: "Clientes" },
  { path: "/vehiculos", title: "Vehículos" },
  { path: "/empleados", title: "Empleados" },
  { path: "/reportes", title: "Reportes" },
  { path: "/configuracion", title: "Configuración" },
];

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();

  const title = TITLES.find(
    (entry) =>
      location.pathname === entry.path || location.pathname.startsWith(entry.path + "/")
  )?.title;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        height: TOPBAR_HEIGHT,
        bgcolor: "transparent",
        borderBottom: "1px solid",
        borderColor: "divider",
        justifyContent: "center",
      }}
    >
      <Toolbar
        disableGutters
        sx={{ minHeight: TOPBAR_HEIGHT, height: TOPBAR_HEIGHT, px: "20px", gap: "12px" }}
      >
        {isMobile && (
          <IconButton
            onClick={onMenuToggle}
            aria-label="Abrir menú"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "4px",
              border: "1px solid",
              borderColor: "grey.400",
              color: "text.secondary",
              "&:hover": { bgcolor: "grey.200" },
            }}
          >
            <MenuIcon sx={{ fontSize: "1rem" }} />
          </IconButton>
        )}

        {title && (
          <Typography
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "text.muted",
            }}
          >
            {title}
          </Typography>
        )}
      </Toolbar>
    </AppBar>
  );
}
