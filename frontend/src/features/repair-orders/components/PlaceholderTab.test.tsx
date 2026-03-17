import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PlaceholderTab } from "./PlaceholderTab";

describe("PlaceholderTab", () => {
  it("given component, when rendered, then shows Próximamente text", () => {
    render(<PlaceholderTab />);

    expect(screen.getByText("Próximamente")).toBeInTheDocument();
  });
});
