import { lazy, Suspense } from "react";

import { Routes, Route } from "react-router";
import { CircularProgress, Box } from "@mui/material";

const HomePage = lazy(() => import("@/pages/HomePage"));
const EmployeesPage = lazy(() => import("@/pages/EmployeesPage"));

function Loading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <CircularProgress />
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/empleados" element={<EmployeesPage />} />
      </Routes>
    </Suspense>
  );
}
