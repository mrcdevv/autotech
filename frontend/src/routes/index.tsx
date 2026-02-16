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
const InspectionTemplateListPage = lazy(() => import("@/pages/InspectionTemplateListPage"));
const InspectionTemplateBuilderPage = lazy(() => import("@/pages/InspectionTemplateBuilderPage"));
const CommonProblemsPage = lazy(() => import("@/pages/CommonProblemsPage"));
const EstimatesPage = lazy(() => import("@/pages/EstimatesPage"));
const EstimateDetailPage = lazy(() => import("@/pages/EstimateDetailPage"));
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("@/pages/InvoiceDetailPage"));

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
        <Route path="/configuracion/plantillas-inspeccion" element={<InspectionTemplateListPage />} />
        <Route path="/configuracion/plantillas-inspeccion/nueva" element={<InspectionTemplateBuilderPage />} />
        <Route path="/configuracion/plantillas-inspeccion/:id/editar" element={<InspectionTemplateBuilderPage />} />
        <Route path="/configuracion/problemas-comunes" element={<CommonProblemsPage />} />
        <Route path="/presupuestos" element={<EstimatesPage />} />
        <Route path="/presupuestos/:id" element={<EstimateDetailPage />} />
        <Route path="/facturas" element={<InvoicesPage />} />
        <Route path="/facturas/:id" element={<InvoiceDetailPage />} />
      </Routes>
    </Suspense>
  );
}
