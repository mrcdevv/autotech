import { useState } from "react";

import { Outlet } from "react-router";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import TopBar from "./TopBar";

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isMobile ? "100%" : `calc(100% - ${SIDEBAR_WIDTH}px)`,
          mt: "56px",
          minHeight: "calc(100vh - 56px)",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
