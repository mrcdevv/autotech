import { useState } from "react";

import { Box, Stack } from "@mui/material";

import { PageShell } from "@/components/PageShell";
import { BankAccountsTab } from "@/features/settings/components/BankAccountsTab";
import { CalendarSettingsTab } from "@/features/settings/components/CalendarSettingsTab";
import { DashboardSettingsTab } from "@/features/settings/components/DashboardSettingsTab";
import { InspectionTemplatesTab } from "@/features/settings/components/InspectionTemplatesTab";
import { SettingsSideNav } from "@/features/settings/components/SettingsSideNav";
import { TagsSettingsTab } from "@/features/settings/components/TagsSettingsTab";

import type { SettingsNavSection } from "@/features/settings/components/SettingsSideNav";

const SETTINGS_SECTIONS: SettingsNavSection[] = [
  {
    title: "Taller",
    items: [
      { id: "calendar", label: "Calendario" },
      { id: "dashboard", label: "Panel de inicio" },
    ],
  },
  {
    title: "Catálogos",
    items: [
      { id: "bank-accounts", label: "Cuentas bancarias" },
      { id: "inspection-templates", label: "Fichas técnicas" },
      { id: "tags", label: "Etiquetas" },
    ],
  },
];

export default function SettingsPage() {
  const [activeId, setActiveId] = useState("calendar");

  const renderContent = () => {
    switch (activeId) {
      case "bank-accounts":
        return <BankAccountsTab />;
      case "inspection-templates":
        return <InspectionTemplatesTab />;
      case "calendar":
        return <CalendarSettingsTab />;
      case "tags":
        return <TagsSettingsTab />;
      case "dashboard":
        return <DashboardSettingsTab />;
      default:
        return null;
    }
  };

  return (
    <PageShell title="Configuración">
      <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 3 }}>
        <Box sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0 }}>
          <SettingsSideNav
            sections={SETTINGS_SECTIONS}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>{renderContent()}</Box>
      </Stack>
    </PageShell>
  );
}
