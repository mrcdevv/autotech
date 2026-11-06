import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { AuditHistoryPanel } from "./AuditHistoryPanel";

const { mockGetAuditLogs } = vi.hoisted(() => ({
  mockGetAuditLogs: vi.fn(),
}));

vi.mock("@/api/auditLogs", () => ({
  auditLogsApi: { getByEntity: mockGetAuditLogs },
}));

const row = (overrides: Partial<Parameters<typeof JSON.stringify>[0]> = {}) => ({
  id: 1,
  entityType: "REPAIR_ORDER",
  entityId: 1,
  action: "ACTUALIZAR",
  oldValues: null,
  newValues: null,
  performedByEmployeeId: null,
  performedByEmployeeName: null,
  createdAt: "2025-02-01T12:00:00",
  ...overrides,
});

describe("AuditHistoryPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given rows from the API, when rendered, then rows appear newest first with the actor's name", async () => {
    mockGetAuditLogs.mockResolvedValue({
      data: {
        data: [
          row({ id: 2, action: "ENTREGA", performedByEmployeeName: "Marta Gomez", createdAt: "2025-02-02T12:00:00" }),
          row({ id: 1, action: "CREACION", performedByEmployeeName: "Juan Perez", createdAt: "2025-02-01T12:00:00" }),
        ],
      },
    });

    render(<AuditHistoryPanel entityType="REPAIR_ORDER" entityId={1} />);

    expect(await screen.findByText("Marta Gomez")).toBeInTheDocument();
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();

    // Newest first: the ENTREGA row must precede the CREACION row in the document.
    const entrega = screen.getByText("ENTREGA");
    const creacion = screen.getByText("CREACION");
    expect(entrega.compareDocumentPosition(creacion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("given a raw JSON payload, when rendered, then the values become readable key/value pairs", async () => {
    mockGetAuditLogs.mockResolvedValue({
      data: {
        data: [
          row({
            oldValues: '{"status":"PENDIENTE","total":1200}',
            newValues: '{"status":"ACEPTADO","total":1500}',
          }),
        ],
      },
    });

    render(<AuditHistoryPanel entityType="ESTIMATE" entityId={3} />);

    expect(await screen.findByText("PENDIENTE")).toBeInTheDocument();
    expect(screen.getByText("ACEPTADO")).toBeInTheDocument();
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
    // Both sides carry the same keys: one per parsed side.
    expect(screen.getAllByText("status")).toHaveLength(2);
    expect(screen.getAllByText("total")).toHaveLength(2);
  });

  it("given a row without an actor, when rendered, then the actor is shown as 'No registrado' instead of a blank", async () => {
    mockGetAuditLogs.mockResolvedValue({ data: { data: [row()] } });

    render(<AuditHistoryPanel entityType="REPAIR_ORDER" entityId={1} />);

    expect(await screen.findByText("No registrado")).toBeInTheDocument();
  });

  it("given an empty history, when rendered, then nothing is rendered at all", async () => {
    mockGetAuditLogs.mockResolvedValue({ data: { data: [] } });

    const { container } = render(<AuditHistoryPanel entityType="REPAIR_ORDER" entityId={1} />);

    await waitFor(() => expect(mockGetAuditLogs).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("given a malformed JSON payload, when rendered, then the raw text degrades instead of crashing", async () => {
    mockGetAuditLogs.mockResolvedValue({
      data: {
        data: [row({ oldValues: '{"status":', newValues: "not json at all" })],
      },
    });

    render(<AuditHistoryPanel entityType="REPAIR_ORDER" entityId={1} />);

    expect(await screen.findByText('{"status":')).toBeInTheDocument();
    expect(screen.getByText("not json at all")).toBeInTheDocument();
  });

  it("given null oldValues and newValues, when rendered, then each side renders as an em dash", async () => {
    mockGetAuditLogs.mockResolvedValue({ data: { data: [row()] } });

    render(<AuditHistoryPanel entityType="REPAIR_ORDER" entityId={1} />);

    expect(await screen.findByText("ACTUALIZAR")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("given a load failure, when rendered, then the failure is shown honestly instead of silently swallowed", async () => {
    mockGetAuditLogs.mockRejectedValue(new Error("network"));

    render(<AuditHistoryPanel entityType="REPAIR_ORDER" entityId={1} />);

    expect(
      await screen.findByText("No se pudo cargar el historial de cambios."),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("given the entity id changes, when re-rendered, then the audit history is fetched again for the new id", async () => {
    mockGetAuditLogs.mockResolvedValue({ data: { data: [] } });

    const { rerender } = render(<AuditHistoryPanel entityType="ESTIMATE" entityId={3} />);
    await waitFor(() => expect(mockGetAuditLogs).toHaveBeenCalledWith("ESTIMATE", 3));

    rerender(<AuditHistoryPanel entityType="ESTIMATE" entityId={4} />);
    await waitFor(() => expect(mockGetAuditLogs).toHaveBeenCalledWith("ESTIMATE", 4));
    expect(mockGetAuditLogs).toHaveBeenCalledTimes(2);
  });
});
