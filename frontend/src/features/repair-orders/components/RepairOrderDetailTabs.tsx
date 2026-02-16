import { useState } from "react";

import { Box, Tabs, Tab } from "@mui/material";

import { GeneralInfoTab } from "./GeneralInfoTab";
import { PlaceholderTab } from "./PlaceholderTab";

import type { RepairOrderDetailResponse } from "../types";

interface RepairOrderDetailTabsProps {
  order: RepairOrderDetailResponse | null;
  loading: boolean;
}

const TAB_LABELS = [
  "Información General",
  "Inspecciones",
  "Presupuesto",
  "Trabajos",
  "Factura",
];

export function RepairOrderDetailTabs({ order, loading }: RepairOrderDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, newValue: number) => setActiveTab(newValue)}>
        {TAB_LABELS.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {activeTab === 0 && <GeneralInfoTab order={order} loading={loading} />}
      {activeTab === 1 && <PlaceholderTab />}
      {activeTab === 2 && <PlaceholderTab />}
      {activeTab === 3 && <PlaceholderTab />}
      {activeTab === 4 && <PlaceholderTab />}
    </Box>
  );
}
