import { useState } from "react";

import { Tabs, Tab } from "@mui/material";
import { useSearchParams } from "react-router";

import { PageShell } from "@/components/PageShell";
import { BankAccountsTab } from "@/features/settings/components/BankAccountsTab";
import { InspectionTemplatesTab } from "@/features/settings/components/InspectionTemplatesTab";
import { CalendarSettingsTab } from "@/features/settings/components/CalendarSettingsTab";
import { RepairOrderSettingsTab } from "@/features/settings/components/RepairOrderSettingsTab";
import { DashboardSettingsTab } from "@/features/settings/components/DashboardSettingsTab";
import { TagsSettingsTab } from "@/features/settings/components/TagsSettingsTab";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const initialTab = Number(searchParams.get("tab")) || 0;
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <PageShell title="Configuración">
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2.5 }}>
        <Tab label="Pagos / Cuentas bancarias" />
        <Tab label="Fichas técnicas" />
        <Tab label="Calendario" />
        <Tab label="Órdenes de trabajo" />
        <Tab label="Etiquetas" />
        <Tab label="Panel de inicio" />
      </Tabs>

      {activeTab === 0 && <BankAccountsTab />}
      {activeTab === 1 && <InspectionTemplatesTab />}
      {activeTab === 2 && <CalendarSettingsTab />}
      {activeTab === 3 && <RepairOrderSettingsTab />}
      {activeTab === 4 && <TagsSettingsTab />}
      {activeTab === 5 && <DashboardSettingsTab />}
    </PageShell>
  );
}
