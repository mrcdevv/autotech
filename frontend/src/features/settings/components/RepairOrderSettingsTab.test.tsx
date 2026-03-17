import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { RepairOrderSettingsTab } from "./RepairOrderSettingsTab";

vi.mock("@/features/settings/components/TagsManager", () => ({
  TagsManager: () => <div data-testid="tags-manager">TagsManager</div>,
}));

describe("RepairOrderSettingsTab", () => {
  it("given tab, when rendered, then shows title and TagsManager", () => {
    render(<RepairOrderSettingsTab />);

    expect(screen.getByText("Etiquetas")).toBeInTheDocument();
    expect(screen.getByTestId("tags-manager")).toBeInTheDocument();
  });
});
