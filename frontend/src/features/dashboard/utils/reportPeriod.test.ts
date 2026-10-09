import dayjs from "dayjs";
import { describe, it, expect } from "vitest";

import {
  buildMonthlyBillingBuckets,
  resolvePeriod,
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

describe("buildMonthlyBillingBuckets", () => {
  it("given missing months, when building, then fills every month in range with zero", () => {
    const buckets = buildMonthlyBillingBuckets(
      [{ year: 2026, month: 9, total: 1000 }],
      "2026-07-01",
      "2026-09-30"
    );

    expect(buckets).toEqual([
      { year: 2026, month: 7, total: 0 },
      { year: 2026, month: 8, total: 0 },
      { year: 2026, month: 9, total: 1000 },
    ]);
  });
});
