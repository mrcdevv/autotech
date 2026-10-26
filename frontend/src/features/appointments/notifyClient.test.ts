import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { getNotifyClientDefault, hasEmail } from "./notifyClient";

const now = dayjs("2026-10-17T10:00:00");

describe("getNotifyClientDefault", () => {
  it("given future slot and client with email, when computing default, then returns true", () => {
    expect(getNotifyClientDefault({ hasEmail: true, startTime: "2026-10-18T09:00:00", now })).toBe(true);
  });

  it("given slot in the past, when computing default, then returns false", () => {
    expect(getNotifyClientDefault({ hasEmail: true, startTime: "2026-10-17T09:00:00", now })).toBe(false);
  });

  it("given client already at the workshop, when computing default, then returns false", () => {
    expect(
      getNotifyClientDefault({ hasEmail: true, startTime: "2026-10-18T09:00:00", clientArrived: true, now }),
    ).toBe(false);
  });

  it("given client without email, when computing default, then returns false", () => {
    expect(getNotifyClientDefault({ hasEmail: false, startTime: "2026-10-18T09:00:00", now })).toBe(false);
  });

  it("given no start time yet, when computing default, then returns false", () => {
    expect(getNotifyClientDefault({ hasEmail: true, startTime: null, now })).toBe(false);
  });
});

describe("hasEmail", () => {
  it("given blank or null email, when checking, then returns false", () => {
    expect(hasEmail(null)).toBe(false);
    expect(hasEmail("  ")).toBe(false);
    expect(hasEmail("a@b.com")).toBe(true);
  });
});
