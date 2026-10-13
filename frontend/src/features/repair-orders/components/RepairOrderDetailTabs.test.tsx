import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter, useLocation } from "react-router";

import { RepairOrderDetailTabs } from "./RepairOrderDetailTabs";

import type { RepairOrderDetailResponse } from "../types";

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: () => <div data-testid="mock-datagrid" />,
}));

vi.mock("@/features/inspections/InspectionsTab", () => ({
  InspectionsTab: () => <div data-testid="inspections-tab">InspectionsTab</div>,
}));

vi.mock("@/features/estimates/components/EstimateTab", () => ({
  EstimateTab: () => <div data-testid="estimate-tab">EstimateTab</div>,
}));

vi.mock("@/features/invoices/components/InvoiceTab", () => ({
  InvoiceTab: () => <div data-testid="invoice-tab">InvoiceTab</div>,
}));

const mockRefetch = vi.fn();

const sampleOrder: RepairOrderDetailResponse = {
  id: 1,
  title: "OT-1 Perez - ABC123",
  status: "INGRESO_VEHICULO",
  reason: "Engine noise",
  clientSource: null,
  mechanicNotes: null,
  appointmentId: null,
  clientId: 1,
  clientFirstName: "Juan",
  clientLastName: "Perez",
  clientDni: "12345678",
  clientPhone: "1234567890",
  clientEmail: "juan@test.com",
  vehicleId: 1,
  vehiclePlate: "ABC123",
  vehicleBrandName: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: 2020,
  vehicleChassisNumber: "CHASSIS001",
  employees: [],
  tags: [],
  workHistory: [],
  createdAt: "2025-01-15T10:00:00",
  updatedAt: "2025-01-15T10:00:00",
};

function LocationProbe({ record }: { record: { search: string } }) {
  const location = useLocation();
  record.search = location.search;
  return null;
}

function renderTabs(search = "") {
  const record = { search: "" };
  const utils = render(
    <MemoryRouter initialEntries={[`/ordenes-trabajo/1${search}`]}>
      <LocationProbe record={record} />
      <RepairOrderDetailTabs order={sampleOrder} loading={false} onRefetch={mockRefetch} />
    </MemoryRouter>,
  );
  return { ...utils, record };
}

describe("RepairOrderDetailTabs", () => {
  it("given order, when rendered, then shows the tab labels", () => {
    renderTabs();

    expect(screen.getByText("Información General")).toBeInTheDocument();
    expect(screen.getByText("Inspecciones")).toBeInTheDocument();
    expect(screen.getByText("Presupuesto")).toBeInTheDocument();
    expect(screen.queryByText("Trabajos")).not.toBeInTheDocument();
    expect(screen.getByText("Factura")).toBeInTheDocument();
  });

  it("given order and no tab param, when rendered, then shows GeneralInfoTab content", () => {
    renderTabs();

    expect(screen.getByText("Resumen Financiero")).toBeInTheDocument();
    expect(screen.getByText("Motivo y Notas")).toBeInTheDocument();
  });

  it("given order, when clicking Inspecciones tab, then shows InspectionsTab", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByText("Inspecciones"));

    expect(screen.getByTestId("inspections-tab")).toBeInTheDocument();
  });

  it("given order, when clicking Presupuesto tab, then shows EstimateTab", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByText("Presupuesto"));

    expect(screen.getByTestId("estimate-tab")).toBeInTheDocument();
  });

  it("given order, when clicking Factura tab, then shows InvoiceTab", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByText("Factura"));

    expect(screen.getByTestId("invoice-tab")).toBeInTheDocument();
  });

  it("given deep link with ?tab=factura, when rendered, then shows the invoice tab on first render", () => {
    renderTabs("?tab=factura");

    expect(screen.getByTestId("invoice-tab")).toBeInTheDocument();
    expect(screen.queryByText("Resumen Financiero")).not.toBeInTheDocument();
  });

  it("given deep link with ?tab=inspecciones, when rendered, then shows the inspections tab", () => {
    renderTabs("?tab=inspecciones");

    expect(screen.getByTestId("inspections-tab")).toBeInTheDocument();
  });

  it("given deep link with ?tab=presupuesto, when rendered, then shows the estimate tab", () => {
    renderTabs("?tab=presupuesto");

    expect(screen.getByTestId("estimate-tab")).toBeInTheDocument();
  });

  it("given the General tab shown, when clicking another tab, then the URL query param updates", async () => {
    const user = userEvent.setup();
    const { record } = renderTabs();

    await user.click(screen.getByText("Factura"));

    expect(record.search).toBe("?tab=factura");
  });

  it("given the invoice tab via deep link, when clicking Información General, then the URL query param updates", async () => {
    const user = userEvent.setup();
    const { record } = renderTabs("?tab=factura");

    await user.click(screen.getByText("Información General"));

    expect(record.search).toBe("?tab=general");
  });

  it("given an unknown tab value, when rendered, then falls back to the General tab without crashing", () => {
    renderTabs("?tab=banana");

    expect(screen.getByText("Resumen Financiero")).toBeInTheDocument();
    expect(screen.queryByTestId("invoice-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("inspections-tab")).not.toBeInTheDocument();
  });

  it("given an out-of-range numeric tab value, when rendered, then falls back to the General tab", () => {
    renderTabs("?tab=99");

    expect(screen.getByText("Resumen Financiero")).toBeInTheDocument();
    expect(screen.queryByTestId("invoice-tab")).not.toBeInTheDocument();
  });
});
