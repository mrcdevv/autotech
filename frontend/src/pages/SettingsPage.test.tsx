import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, describe, it, expect } from "vitest";

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

vi.mock("@/features/settings/components/RepairOrderSettingsTab", () => ({
  RepairOrderSettingsTab: () => <div data-testid="repair-order-settings-tab">RepairOrderSettingsTab</div>,
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
  it("given page, when rendered, then shows title and settings tabs", () => {
    renderSettingsPage();

    expect(screen.getByText("Configuración")).toBeInTheDocument();
    expect(screen.getByText("Pagos / Cuentas bancarias")).toBeInTheDocument();
    expect(screen.getByText("Fichas técnicas")).toBeInTheDocument();
    expect(screen.getByText("Calendario")).toBeInTheDocument();
    expect(screen.getByText("Órdenes de trabajo")).toBeInTheDocument();
    expect(screen.getByText("Etiquetas")).toBeInTheDocument();
    expect(screen.getByText("Panel de inicio")).toBeInTheDocument();
  });

  it("given page, when rendered, then shows first tab by default", () => {
    renderSettingsPage();

    expect(screen.getByTestId("bank-accounts-tab")).toBeInTheDocument();
  });

  it("given tabs, when clicking second tab, then shows inspection templates", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Fichas técnicas"));

    expect(screen.getByTestId("inspection-templates-tab")).toBeInTheDocument();
  });

  it("given tabs, when clicking third tab, then shows calendar settings", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Calendario"));

    expect(screen.getByTestId("calendar-settings-tab")).toBeInTheDocument();
  });

  it("given tabs, when clicking fourth tab, then shows repair order settings", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Órdenes de trabajo"));

    expect(screen.getByTestId("repair-order-settings-tab")).toBeInTheDocument();
  });

  it("given tabs, when clicking tags tab, then shows tag settings", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Etiquetas"));

    expect(screen.getByTestId("tags-settings-tab")).toBeInTheDocument();
  });

  it("given tabs, when clicking dashboard tab, then shows dashboard settings", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByText("Panel de inicio"));

    expect(screen.getByTestId("dashboard-settings-tab")).toBeInTheDocument();
  });
});
