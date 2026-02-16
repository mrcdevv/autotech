import { lazy, Suspense } from "react";

import { Routes, Route } from "react-router";
import { CircularProgress, Box } from "@mui/material";

const HomePage = lazy(() => import("@/pages/HomePage"));
const EmployeesPage = lazy(() => import("@/pages/EmployeesPage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const CannedJobsPage = lazy(() => import("@/pages/CannedJobsPage"));
const ClientsPage = lazy(() => import("@/pages/ClientsPage"));

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
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/trabajos-enlatados" element={<CannedJobsPage />} />
        <Route path="/clientes" element={<ClientsPage />} />
      </Routes>
    </Suspense>
  );
}
