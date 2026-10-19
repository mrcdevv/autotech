import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PublicUnsubscribePage from "./PublicUnsubscribePage";

const { mockGet, mockUnsubscribe } = vi.hoisted(() => ({ mockGet: vi.fn(), mockUnsubscribe: vi.fn() }));

vi.mock("@/api/publicUnsubscribe", () => ({
  publicUnsubscribeApi: { getByToken: mockGet, unsubscribe: mockUnsubscribe },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/baja/tok"]}>
      <Routes>
        <Route path="/baja/:token" element={<PublicUnsubscribePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicUnsubscribePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { data: { clientFirstName: "Ana", optedOut: false } } });
  });

  it("given a subscribed client, when confirming, then unsubscribes and shows confirmation", async () => {
    const user = userEvent.setup();
    mockUnsubscribe.mockResolvedValue({ data: { data: { clientFirstName: "Ana", optedOut: true } } });
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Darme de baja" }));

    expect(await screen.findByText("Listo, te diste de baja")).toBeInTheDocument();
    expect(mockUnsubscribe).toHaveBeenCalledWith("tok");
  });

  it("given an invalid link, when loading, then shows an error", async () => {
    mockGet.mockRejectedValue(
      Object.assign(new Error("404"), {
        isAxiosError: true,
        response: { data: { message: "El enlace para darte de baja no es válido" } },
      }),
    );

    renderPage();

    expect(await screen.findByText("El enlace para darte de baja no es válido")).toBeInTheDocument();
  });
});
