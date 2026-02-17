import { lazy, Suspense } from "react";

import { Routes, Route } from "react-router";
import { CircularProgress, Box } from "@mui/material";

const HomePage = lazy(() => import("@/pages/HomePage"));
const EmployeesPage = lazy(() => import("@/pages/EmployeesPage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const CannedJobsPage = lazy(() => import("@/pages/CannedJobsPage"));
const ClientsPage = lazy(() => import("@/pages/ClientsPage"));
const VehiclesPage = lazy(() => import("@/pages/VehiclesPage"));
const AppointmentsPage = lazy(() => import("@/pages/AppointmentsPage"));
const RepairOrdersPage = lazy(() => import("@/pages/RepairOrdersPage"));
const CreateRepairOrderPage = lazy(() => import("@/pages/CreateRepairOrderPage"));
const RepairOrderDetailPage = lazy(() => import("@/pages/RepairOrderDetailPage"));

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
        <Route path="/vehiculos" element={<VehiclesPage />} />
        <Route path="/calendario" element={<AppointmentsPage />} />
        <Route path="/ordenes-trabajo" element={<RepairOrdersPage />} />
        <Route path="/ordenes-trabajo/nueva" element={<CreateRepairOrderPage />} />
        <Route path="/ordenes-trabajo/:id" element={<RepairOrderDetailPage />} />
      </Routes>
    </Suspense>
  );
}
