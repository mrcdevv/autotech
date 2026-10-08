import { Stack, Typography } from "@mui/material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";

import { PageShell } from "@/components/PageShell";
import { BankAccountsTab } from "@/features/settings/components/BankAccountsTab";
import { CalendarSettingsTab } from "@/features/settings/components/CalendarSettingsTab";
import { ConfigCard } from "@/features/settings/components/ConfigCard";
import { DashboardSettingsTab } from "@/features/settings/components/DashboardSettingsTab";
import { InspectionTemplatesTab } from "@/features/settings/components/InspectionTemplatesTab";
import { SettingsSection } from "@/features/settings/components/SettingsSection";
import { TagsSettingsTab } from "@/features/settings/components/TagsSettingsTab";

export default function SettingsPage() {
  return (
    <PageShell title="Configuración">
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Gestioná los ajustes generales del taller
      </Typography>

      <Stack spacing={4}>
        <SettingsSection
          id="taller"
          title="Taller"
          subtitle="Operación diaria"
          icon={<BuildOutlinedIcon />}
        >
          <ConfigCard title="Calendario" icon={<CalendarMonthOutlinedIcon />}>
            <CalendarSettingsTab />
          </ConfigCard>
          <ConfigCard title="Panel de inicio" icon={<DashboardOutlinedIcon />}>
            <DashboardSettingsTab />
          </ConfigCard>
        </SettingsSection>

        <SettingsSection
          id="catalogos"
          title="Catálogos"
          subtitle="Datos de referencia"
          icon={<Inventory2OutlinedIcon />}
        >
          <ConfigCard title="Cuentas bancarias" icon={<AccountBalanceOutlinedIcon />}>
            <BankAccountsTab />
          </ConfigCard>
          <ConfigCard title="Fichas técnicas" icon={<DescriptionOutlinedIcon />}>
            <InspectionTemplatesTab />
          </ConfigCard>
          <ConfigCard title="Etiquetas" icon={<LabelOutlinedIcon />}>
            <TagsSettingsTab />
          </ConfigCard>
        </SettingsSection>
      </Stack>
    </PageShell>
  );
}
