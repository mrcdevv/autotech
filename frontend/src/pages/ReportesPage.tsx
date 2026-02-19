import { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { FinancieroTab } from "@/features/dashboard/components/FinancieroTab";
import { ProductividadTab } from "@/features/dashboard/components/ProductividadTab";

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Reportes
      </Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Financiero" />
        <Tab label="Productividad" />
      </Tabs>

      {activeTab === 0 && <FinancieroTab />}
      {activeTab === 1 && <ProductividadTab />}
    </Box>
  );
}
