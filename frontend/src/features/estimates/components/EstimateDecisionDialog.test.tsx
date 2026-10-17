import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EstimateDecisionDialog } from "./EstimateDecisionDialog";

describe("EstimateDecisionDialog", () => {
  it("given no channel selected, when rendering, then confirm button is disabled", () => {
    render(<EstimateDecisionDialog open decision="approve" onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Aprobar" })).toBeDisabled();
    expect(screen.queryByLabelText(/enlace del email/i)).not.toBeInTheDocument();
  });

  it("given WhatsApp selected, when confirming a rejection, then calls onConfirm with WHATSAPP", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<EstimateDecisionDialog open decision="reject" onClose={vi.fn()} onConfirm={onConfirm} />);

    await user.click(screen.getByLabelText("WhatsApp"));
    await user.click(screen.getByRole("button", { name: "Rechazar" }));

    expect(onConfirm).toHaveBeenCalledWith("WHATSAPP");
  });
});
