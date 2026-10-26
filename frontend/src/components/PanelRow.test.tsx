import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, it, expect } from "vitest";

import { PanelRow } from "./PanelRow";

function LocationProbe({ onLocation }: { onLocation: (pathname: string) => void }) {
  const location = useLocation();
  onLocation(location.pathname);
  return null;
}

describe("PanelRow", () => {
  it("given no `to`, when rendered, then renders a plain row and not a link (regression guard)", () => {
    render(
      <PanelRow>
        <span>row content</span>
      </PanelRow>,
    );

    expect(screen.getByText("row content")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("given `to`, when rendered, then renders a real link with the correct href", () => {
    render(
      <MemoryRouter>
        <PanelRow to="/ordenes-trabajo/5" ariaLabel="Ir a la orden #5">
          <span>row content</span>
        </PanelRow>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Ir a la orden #5" });
    expect(link).toHaveAttribute("href", "/ordenes-trabajo/5");
  });

  it("given `to`, when clicked, then navigates to the target", async () => {
    let pathname = "";
    const onLocation = (value: string) => {
      pathname = value;
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocationProbe onLocation={onLocation} />
        <PanelRow to="/presupuestos/3" ariaLabel="Ir al presupuesto #3">
          <span>row content</span>
        </PanelRow>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Ir al presupuesto #3" }));

    expect(pathname).toBe("/presupuestos/3");
  });
});
