import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("SettingsPage", () => {
  it("given page, when rendered, then shows title and 4 tabs", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Configuracion")).toBeInTheDocument();
    expect(screen.getByText("Pagos / Cuentas bancarias")).toBeInTheDocument();
    expect(screen.getByText("Fichas técnicas")).toBeInTheDocument();
    expect(screen.getByText("Calendario")).toBeInTheDocument();
    expect(screen.getByText("Órdenes de trabajo")).toBeInTheDocument();
  });

  it("given page, when rendered, then shows first tab by default", () => {
    render(<SettingsPage />);

    expect(screen.getByTestId("bank-accounts-tab")).toBeInTheDocument();
  });

  it("given tabs, when clicking second tab, then shows inspection templates", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText("Fichas técnicas"));

    expect(screen.getByTestId("inspection-templates-tab")).toBeInTheDocument();
  });

  it("given tabs, when clicking third tab, then shows calendar settings", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText("Calendario"));

    expect(screen.getByTestId("calendar-settings-tab")).toBeInTheDocument();
  });

  it("given tabs, when clicking fourth tab, then shows repair order settings", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText("Órdenes de trabajo"));

    expect(screen.getByTestId("repair-order-settings-tab")).toBeInTheDocument();
  });
});
