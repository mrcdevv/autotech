import { useState } from "react";

import { Box, Tabs, Tab } from "@mui/material";

import { GeneralInfoTab } from "./GeneralInfoTab";
import { PlaceholderTab } from "./PlaceholderTab";
import { InspectionsTab } from "@/features/inspections/InspectionsTab";
import { EstimateTab } from "@/features/estimates/components/EstimateTab";

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
  "Trabajos",
  "Factura",
];

export function RepairOrderDetailTabs({ order, loading, onRefetch }: RepairOrderDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, newValue: number) => setActiveTab(newValue)}>
        {TAB_LABELS.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {activeTab === 0 && <GeneralInfoTab order={order} loading={loading} />}
      {activeTab === 1 && order && (
        <InspectionsTab
          repairOrderId={order.id}
          reason={order.reason}
          mechanicNotes={order.mechanicNotes}
          onRepairOrderUpdated={onRefetch}
        />
      )}
      {activeTab === 2 && order && <EstimateTab repairOrderId={order.id} />}
      {activeTab === 3 && <PlaceholderTab />}
      {activeTab === 4 && <PlaceholderTab />}
    </Box>
  );
}
