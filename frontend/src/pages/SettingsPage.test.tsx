import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import SettingsPage from "./SettingsPage";

vi.mock("@/features/settings/components/BankAccountsTab", () => ({
  BankAccountsTab: () => <div data-testid="bank-accounts-tab">BankAccountsTab</div>,
}));

vi.mock("@/features/settings/components/InspectionTemplatesTab", () => ({
  InspectionTemplatesTab: () => <div data-testid="inspection-templates-tab">InspectionTemplatesTab</div>,
}));

vi.mock("@/features/settings/components/CalendarSettingsTab", () => ({
  CalendarSettingsTab: () => <div data-testid="calendar-settings-tab">CalendarSettingsTab</div>,
}));

vi.mock("@/features/settings/components/TagsSettingsTab", () => ({
  TagsSettingsTab: () => <div data-testid="tags-settings-tab">TagsSettingsTab</div>,
}));

vi.mock("@/features/settings/components/DashboardSettingsTab", () => ({
  DashboardSettingsTab: () => <div data-testid="dashboard-settings-tab">DashboardSettingsTab</div>,
}));

vi.mock("@/features/settings/components/RolesSettings", () => ({
  RolesSettings: () => <div data-testid="roles-settings">RolesSettings</div>,
}));

vi.mock("@/features/settings/components/NotificationSettings", () => ({
  NotificationSettings: () => <div data-testid="notification-settings">NotificationSettings</div>,
}));

vi.mock("@/features/settings/components/NotificationActions", () => ({
  NotificationActions: () => <div data-testid="notification-actions">NotificationActions</div>,
}));

vi.mock("@/features/settings/components/TaxSettings", () => ({
  TaxSettings: () => <div data-testid="tax-settings">TaxSettings</div>,
}));

function renderSettingsPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  it("given page, when rendered, then shows subtitle", () => {
    renderSettingsPage();

    expect(screen.getByText("Gestioná los ajustes generales del taller")).toBeInTheDocument();
  });

  it("given page, when rendered, then shows all sections", () => {
    renderSettingsPage();

    expect(screen.getByRole("heading", { name: "Taller" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Catálogos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Remitos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Accesos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notificaciones" })).toBeInTheDocument();
  });

  it("given page, when rendered, then shows billing and access cards", () => {
    renderSettingsPage();

    expect(screen.getAllByText("Impuestos")).toHaveLength(2);
    expect(screen.getAllByText("Roles y permisos")).toHaveLength(2);
  });

  it("given page, when rendered, then renders all settings config components", () => {
    renderSettingsPage();

    expect(screen.getByTestId("calendar-settings-tab")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-settings-tab")).toBeInTheDocument();
    expect(screen.getByTestId("bank-accounts-tab")).toBeInTheDocument();
    expect(screen.getByTestId("inspection-templates-tab")).toBeInTheDocument();
    expect(screen.getByTestId("tags-settings-tab")).toBeInTheDocument();
    expect(screen.getByTestId("tax-settings")).toBeInTheDocument();
    expect(screen.getByTestId("roles-settings")).toBeInTheDocument();
  });
});
