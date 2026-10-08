import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function renderSettingsPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  it("given page, when rendered, then shows all settings navigation items", () => {
    renderSettingsPage();

    expect(screen.getByText("Calendario")).toBeInTheDocument();
    expect(screen.getByText("Panel de inicio")).toBeInTheDocument();
    expect(screen.getByText("Cuentas bancarias")).toBeInTheDocument();
    expect(screen.getByText("Fichas técnicas")).toBeInTheDocument();
    expect(screen.getByText("Etiquetas")).toBeInTheDocument();
    expect(screen.queryByText("Órdenes de trabajo")).not.toBeInTheDocument();
  });

  it("given page, when rendered, then shows calendar settings by default", () => {
    renderSettingsPage();

    expect(screen.getByTestId("calendar-settings-tab")).toBeInTheDocument();
  });

  it("given calendar active, when clicking bank accounts, then shows bank accounts", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Cuentas bancarias"));

    expect(screen.getByTestId("bank-accounts-tab")).toBeInTheDocument();
  });

  it("given calendar active, when clicking inspection templates, then shows inspection templates", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Fichas técnicas"));

    expect(screen.getByTestId("inspection-templates-tab")).toBeInTheDocument();
  });

  it("given calendar active, when clicking dashboard, then shows dashboard settings", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Panel de inicio"));

    expect(screen.getByTestId("dashboard-settings-tab")).toBeInTheDocument();
  });

  it("given calendar active, when clicking tags, then shows tag settings", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Etiquetas"));

    expect(screen.getByTestId("tags-settings-tab")).toBeInTheDocument();
  });
});
