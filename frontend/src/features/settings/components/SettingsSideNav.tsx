import { Box, List, ListItemButton, ListItemText, Typography } from "@mui/material";

export interface SettingsNavItem {
  id: string;
  label: string;
}

export interface SettingsNavSection {
  title: string;
  items: SettingsNavItem[];
}

export interface SettingsSideNavProps {
  sections: SettingsNavSection[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SettingsSideNav({ sections, activeId, onSelect }: SettingsSideNavProps) {
  return (
    <Box component="nav" aria-label="Secciones de configuración">
      {sections.map((section) => (
        <Box key={section.title} component="section" sx={{ mb: 1 }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              px: 2,
              pt: 1,
              pb: 0.5,
              fontWeight: 600,
              color: "text.secondary",
            }}
          >
            {section.title}
          </Typography>
          <List disablePadding>
            {section.items.map((item) => {
              const selected = item.id === activeId;
              return (
                <ListItemButton
                  key={item.id}
                  selected={selected}
                  onClick={() => onSelect(item.id)}
                  aria-current={selected ? "page" : undefined}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
}

