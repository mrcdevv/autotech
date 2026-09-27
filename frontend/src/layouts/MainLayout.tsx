import { useState } from "react";

import { Outlet } from "react-router";
import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { shadow } from "@/theme/tokens";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        bgcolor: "shell.bg",
        overflow: "hidden",
        "@media print": {
          display: "block",
          height: "auto",
          overflow: "visible",
          bgcolor: "#fff",
        },
      }}
    >
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          m: { xs: "8px", md: "12px 12px 12px 2px" },
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: shadow.sheet,
          "@media print": {
            margin: 0,
            border: "none",
            borderRadius: 0,
            boxShadow: "none",
            overflow: "visible",
          },
        }}
      >
        <TopBar onMenuToggle={() => setMobileOpen((prev) => !prev)} />

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            minWidth: 0,
            p: { xs: "12px 12px 24px", md: "16px 20px 28px" },
            "&::-webkit-scrollbar": { width: 10 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "grey.400", borderRadius: "5px" },
            scrollbarWidth: "thin",
            "@media print": {
              padding: 0,
              overflow: "visible",
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
