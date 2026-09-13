import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { TagsManager } from "./TagsManager";

import type { TagResponse } from "@/types/appointment";

const mockTags: TagResponse[] = [
  { id: 1, name: "Urgente", color: "#FF0000" },
  { id: 2, name: "VIP", color: null },
];

const mockRefetch = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/features/settings/hooks/useTags", () => ({
  useTags: () => ({
    tags: mockTags,
    loading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));

vi.mock("@/api/tags", () => ({
  tagsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe("TagsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ data: { data: {} } });
    mockUpdate.mockResolvedValue({ data: { data: {} } });
    mockDelete.mockResolvedValue({ data: { data: null } });
  });

  it("given tags exist, when rendered, then shows tag names", () => {
    render(<TagsManager />);

    expect(screen.getByText("Urgente")).toBeInTheDocument();
    expect(screen.getByText("VIP")).toBeInTheDocument();
  });

  it("given new tag button, when clicked, then opens create dialog", async () => {
    const user = userEvent.setup();
    render(<TagsManager />);

    await user.click(screen.getByRole("button", { name: /nueva etiqueta/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Nueva etiqueta")).toBeInTheDocument();
  });

  it("given edit button on tag, when clicked, then opens edit dialog with data", async () => {
    const user = userEvent.setup();
    render(<TagsManager />);

    const editButtons = screen.getAllByTestId("EditIcon");
    await user.click(editButtons[0]!);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Editar etiqueta")).toBeInTheDocument();
  });

  it("given create dialog, when saving, then calls create and refetches", async () => {
    const user = userEvent.setup();
    render(<TagsManager />);

    await user.click(screen.getByRole("button", { name: /nueva etiqueta/i }));

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByRole("textbox", { name: /nombre/i });
    await user.type(nameInput, "Nuevo Tag");
    await user.click(within(dialog).getByText("Guardar"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ name: "Nuevo Tag", color: null });
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("given delete button, when clicked, then calls delete and refetches", async () => {
    const user = userEvent.setup();
    render(<TagsManager />);

    const deleteButtons = screen.getAllByTestId("DeleteIcon");
    await user.click(deleteButtons[0]!);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(1);
    });
    expect(mockRefetch).toHaveBeenCalled();
  });
});
