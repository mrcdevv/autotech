import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { TagsSettingsTab } from "./TagsSettingsTab";

vi.mock("@/features/settings/components/TagsManager", () => ({
  TagsManager: () => <div data-testid="tags-manager">TagsManager</div>,
}));

describe("TagsSettingsTab", () => {
  it("given tab, when rendered, then shows tags manager", () => {
    render(<TagsSettingsTab />);

    expect(screen.getByText("Etiquetas")).toBeInTheDocument();
    expect(screen.getByTestId("tags-manager")).toBeInTheDocument();
  });
});
