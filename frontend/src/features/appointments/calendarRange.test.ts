import { describe, it, expect } from "vitest";

import { getDateRange } from "./calendarRange";

describe("getDateRange", () => {
  it("given a Wednesday in week mode, then returns Monday 00:00 to next Monday 00:00", () => {
    const { start, end } = getDateRange(new Date(2026, 9, 14, 15, 30), "week");

    expect(start).toEqual(new Date(2026, 9, 12, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 9, 19, 0, 0, 0));
  });

  it("given a Sunday in week mode, then includes it as the last day of the Monday-based week", () => {
    const { start, end } = getDateRange(new Date(2026, 9, 18, 9, 0), "week");

    expect(start).toEqual(new Date(2026, 9, 12, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 9, 19, 0, 0, 0));
  });

  it("given a Monday in week mode, then starts on that same Monday", () => {
    const { start, end } = getDateRange(new Date(2026, 9, 12, 0, 0), "week");

    expect(start).toEqual(new Date(2026, 9, 12, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 9, 19, 0, 0, 0));
  });

  it("given month mode, then returns the first day of the month to the first day of the next", () => {
    const { start, end } = getDateRange(new Date(2026, 9, 18), "month");

    expect(start).toEqual(new Date(2026, 9, 1, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 10, 1, 0, 0, 0));
  });

  it("given day mode, then returns that day only", () => {
    const { start, end } = getDateRange(new Date(2026, 9, 18, 13, 0), "day");

    expect(start).toEqual(new Date(2026, 9, 18, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 9, 19, 0, 0, 0));
  });
});
