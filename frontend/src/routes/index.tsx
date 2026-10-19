import { lazy, Suspense } from "react";

import { Routes, Route } from "react-router";
import { CircularProgress, Box } from "@mui/material";
import MainLayout from "@/layouts/MainLayout";
import { PrivateRoute } from "@/components/PrivateRoute";
import { RequirePermission } from "@/components/RequirePermission";
import { SETTINGS_PERMISSIONS } from "@/features/auth/permissions";
import { Login } from "@/features/auth/components/Login";
import { ChangePassword } from "@/features/auth/components/ChangePassword";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
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
const DeliveryNotesPage = lazy(() => import("@/pages/DeliveryNotesPage"));
const DeliveryNoteDetailPage = lazy(() => import("@/pages/DeliveryNoteDetailPage"));
const ReportesPage = lazy(() => import("@/pages/ReportesPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

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
        <Route path="/login" element={<Login />} />
        
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/paquetes-de-servicios" element={<CannedJobsPage />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route element={<RequirePermission permission="read_employee" />}>
              <Route path="/empleados" element={<EmployeesPage />} />
            </Route>
            <Route element={<RequirePermission permission="read_client" />}>
              <Route path="/clientes" element={<ClientsPage />} />
            </Route>
            <Route element={<RequirePermission permission="read_vehicle" />}>
              <Route path="/vehiculos" element={<VehiclesPage />} />
            </Route>
            <Route element={<RequirePermission permission="read_appointment" />}>
              <Route path="/calendario" element={<AppointmentsPage />} />
            </Route>
            <Route element={<RequirePermission permission="read_order" />}>
              <Route path="/ordenes-trabajo" element={<RepairOrdersPage />} />
              <Route path="/ordenes-trabajo/:id" element={<RepairOrderDetailPage />} />
            </Route>
            <Route element={<RequirePermission permission="create_order" />}>
              <Route path="/ordenes-trabajo/nueva" element={<CreateRepairOrderPage />} />
            </Route>
            <Route element={<RequirePermission permission="manage_services" />}>
              <Route path="/configuracion/plantillas-inspeccion" element={<InspectionTemplateListPage />} />
              <Route path="/configuracion/plantillas-inspeccion/nueva" element={<InspectionTemplateBuilderPage />} />
              <Route path="/configuracion/plantillas-inspeccion/:id/editar" element={<InspectionTemplateBuilderPage />} />
              <Route path="/configuracion/problemas-comunes" element={<CommonProblemsPage />} />
            </Route>
            <Route element={<RequirePermission permission="read_estimate" />}>
              <Route path="/presupuestos" element={<EstimatesPage />} />
              <Route path="/presupuestos/:id" element={<EstimateDetailPage />} />
            </Route>
            <Route element={<RequirePermission permission="read_delivery_note" />}>
              <Route path="/remitos" element={<DeliveryNotesPage />} />
              <Route path="/remitos/:id" element={<DeliveryNoteDetailPage />} />
            </Route>
            <Route element={<RequirePermission permission="view_reports" />}>
              <Route path="/reportes" element={<ReportesPage />} />
            </Route>
            <Route element={<RequirePermission permission={SETTINGS_PERMISSIONS} />}>
              <Route path="/configuracion" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
