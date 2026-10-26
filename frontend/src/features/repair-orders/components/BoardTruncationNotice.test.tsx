import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { BoardTruncationNotice } from "./BoardTruncationNotice";

describe("BoardTruncationNotice", () => {
  it("given truncated board, when rendered, then shows how many of how many orders are visible", () => {
    render(<BoardTruncationNotice shown={200} total={347} />);

    expect(screen.getByText(/200 de 347/)).toBeInTheDocument();
  });

  it("given total below loaded count, when rendered, then renders nothing", () => {
    const { container } = render(<BoardTruncationNotice shown={120} total={87} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("given loaded count equals total (boundary), when rendered, then renders nothing", () => {
    const { container } = render(<BoardTruncationNotice shown={200} total={200} />);

    expect(container).toBeEmptyDOMElement();
  });
});
