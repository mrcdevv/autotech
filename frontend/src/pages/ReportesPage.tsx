import { useState } from "react";

import { Tabs, Tab } from "@mui/material";

import { PageShell } from "@/components/PageShell";
import { FinancieroTab } from "@/features/dashboard/components/FinancieroTab";
import { ProductividadTab } from "@/features/dashboard/components/ProductividadTab";

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <PageShell title="Reportes">
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2.5 }}>
        <Tab label="Financiero" />
        <Tab label="Productividad" />
      </Tabs>

      {activeTab === 0 && <FinancieroTab />}
      {activeTab === 1 && <ProductividadTab />}
    </PageShell>
  );
}
