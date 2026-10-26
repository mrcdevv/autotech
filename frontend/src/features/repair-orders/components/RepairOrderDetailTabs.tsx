import { Box, Tabs, Tab } from "@mui/material";
import { useSearchParams } from "react-router";

import { GeneralInfoTab } from "./GeneralInfoTab";
import { InspectionsTab } from "@/features/inspections/InspectionsTab";
import { EstimateTab } from "@/features/estimates/components/EstimateTab";
import { DeliveryNoteTab } from "@/features/delivery-notes/components/DeliveryNoteTab";

import type { RepairOrderDetailResponse } from "../types";

interface RepairOrderDetailTabsProps {
  order: RepairOrderDetailResponse | null;
  loading: boolean;
  onRefetch: () => void;
}

const TAB_LABELS = [
  "Información General",
  "Inspecciones",
  "Presupuesto",
  "Remito",
];

const TAB_SLUGS = ["general", "inspecciones", "presupuesto", "factura"] as const;

const SLUG_TO_INDEX = new Map<string, number>(TAB_SLUGS.map((slug, index) => [slug, index]));

function tabIndexFromSearch(searchParams: URLSearchParams): number {
  const raw = searchParams.get("tab");
  if (raw === null) return 0;
  return SLUG_TO_INDEX.get(raw.toLowerCase()) ?? 0;
}

export function RepairOrderDetailTabs({ order, loading, onRefetch }: RepairOrderDetailTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = tabIndexFromSearch(searchParams);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const slug: string = TAB_SLUGS[newValue] ?? "general";
    setSearchParams({ tab: slug }, { replace: true });
  };

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange}>
        {TAB_LABELS.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {activeTab === 0 && <GeneralInfoTab order={order} loading={loading} onRefetch={onRefetch} />}
      {activeTab === 1 && order && (
        <InspectionsTab
          repairOrderId={order.id}
          reason={order.reason}
          mechanicNotes={order.mechanicNotes}
          onRepairOrderUpdated={onRefetch}
          clientFirstName={order.clientFirstName}
          clientLastName={order.clientLastName}
          clientDni={order.clientDni}
          vehiclePlate={order.vehiclePlate}
          vehicleBrandName={order.vehicleBrandName}
          vehicleModel={order.vehicleModel}
          vehicleYear={order.vehicleYear}
        />
      )}
      {activeTab === 2 && order && (
        <EstimateTab
          repairOrderId={order.id}
          clientId={order.clientId}
          clientFirstName={order.clientFirstName}
          clientLastName={order.clientLastName}
          clientDni={order.clientDni}
          vehicleId={order.vehicleId}
          vehiclePlate={order.vehiclePlate}
          vehicleBrandName={order.vehicleBrandName}
          vehicleModel={order.vehicleModel}
          vehicleYear={order.vehicleYear}
          reason={order.reason}
          mechanicNotes={order.mechanicNotes}
        />
      )}
      {activeTab === 3 && order && (
        <DeliveryNoteTab repairOrderId={order.id} />
      )}
    </Box>
  );
}
