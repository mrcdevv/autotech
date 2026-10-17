import { describe, expect, it } from "vitest";

import { describeDecision } from "./decisionChannel";

describe("describeDecision", () => {
  it("given a pending estimate, when describing, then returns null", () => {
    expect(
      describeDecision({ status: "PENDIENTE", decisionChannel: null, decidedAt: null, decidedByEmployeeName: null }),
    ).toBeNull();
  });

  it("given an approval via email link, when describing, then mentions the client and the link", () => {
    expect(
      describeDecision({
        status: "ACEPTADO",
        decisionChannel: "EMAIL_LINK",
        decidedAt: "2026-10-17T18:30:00",
        decidedByEmployeeName: null,
      }),
    ).toBe("Aprobado por el cliente desde el enlace del email el 17/10/2026 18:30");
  });

  it("given a staff rejection by phone, when describing, then includes channel and employee", () => {
    expect(
      describeDecision({
        status: "RECHAZADO",
        decisionChannel: "PHONE",
        decidedAt: "2026-10-17T09:05:00",
        decidedByEmployeeName: "Ana Admin",
      }),
    ).toBe("Rechazado por Teléfono el 17/10/2026 09:05 · registrado por Ana Admin");
  });
});
