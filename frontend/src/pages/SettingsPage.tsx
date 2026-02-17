import { useState } from "react";

import { Box, Typography, Tabs, Tab } from "@mui/material";

import { BankAccountsTab } from "@/features/settings/components/BankAccountsTab";
import { InspectionTemplatesTab } from "@/features/settings/components/InspectionTemplatesTab";
import { CalendarSettingsTab } from "@/features/settings/components/CalendarSettingsTab";
import { RepairOrderSettingsTab } from "@/features/settings/components/RepairOrderSettingsTab";
import { DashboardSettingsTab } from "@/features/settings/components/DashboardSettingsTab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Configuracion
      </Typography>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2.5 }}>
        <Tab label="Pagos / Cuentas bancarias" />
        <Tab label="Fichas técnicas" />
        <Tab label="Calendario" />
        <Tab label="Órdenes de trabajo" />
        <Tab label="Dashboard" />
      </Tabs>

      {activeTab === 0 && <BankAccountsTab />}
      {activeTab === 1 && <InspectionTemplatesTab />}
      {activeTab === 2 && <CalendarSettingsTab />}
      {activeTab === 3 && <RepairOrderSettingsTab />}
      {activeTab === 4 && <DashboardSettingsTab />}
    </Box>
  );
}
