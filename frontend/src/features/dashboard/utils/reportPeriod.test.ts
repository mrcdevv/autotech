import dayjs from "dayjs";
import { describe, it, expect } from "vitest";

import {
  buildMonthlyBillingBuckets,
  resolvePeriod,
  resolvePreviousPeriod,
} from "./reportPeriod";

describe("resolvePeriod", () => {
  it("given thisMonth preset, when resolving, then spans the current calendar month", () => {
    const period = resolvePeriod("thisMonth", "", "");

    expect(period.from).toBe(dayjs().startOf("month").format("YYYY-MM-DD"));
    expect(period.to).toBe(dayjs().endOf("month").format("YYYY-MM-DD"));
  });

  it("given last6 preset, when resolving, then starts five months before the current month", () => {
    const period = resolvePeriod("last6", "", "");

    expect(period.from).toBe(
      dayjs().subtract(5, "month").startOf("month").format("YYYY-MM-DD")
    );
  });

  it("given custom preset, when resolving, then keeps the provided dates", () => {
    const period = resolvePeriod("custom", "2026-01-01", "2026-03-31");

    expect(period.from).toBe("2026-01-01");
    expect(period.to).toBe("2026-03-31");
  });
});

describe("resolvePreviousPeriod", () => {
  it("given a whole calendar month, when resolving, then returns the previous calendar month", () => {
    expect(resolvePreviousPeriod("2026-03-01", "2026-03-31")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  it("given a whole year, when resolving, then returns the previous year", () => {
    expect(resolvePreviousPeriod("2026-01-01", "2026-12-31")).toEqual({
      from: "2025-01-01",
      to: "2025-12-31",
    });
  });

  it("given an arbitrary range, when resolving, then returns the same number of days right before it", () => {
    expect(resolvePreviousPeriod("2026-03-10", "2026-03-19")).toEqual({
      from: "2026-02-28",
      to: "2026-03-09",
    });
  });
});

describe("buildMonthlyBillingBuckets", () => {
  it("given missing months, when building, then fills every month in range with zero", () => {
    const buckets = buildMonthlyBillingBuckets(
      [{ year: 2026, month: 9, billed: 1000, collected: 400 }],
      "2026-07-01",
      "2026-09-30"
    );

    expect(buckets).toEqual([
      { year: 2026, month: 7, billed: 0, collected: 0 },
      { year: 2026, month: 8, billed: 0, collected: 0 },
      { year: 2026, month: 9, billed: 1000, collected: 400 },
    ]);
  });
});
