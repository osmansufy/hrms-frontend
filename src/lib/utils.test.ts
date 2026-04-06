/**
 * @jest-environment jsdom
 *
 * Tests for timezone-sensitive utility functions in utils.ts
 * Focus: toLocalDateStr, toStartOfDayISO, toEndOfDayISO
 *
 * Calendar dates are stored as pure UTC-midnight values
 * (e.g. "2026-04-06T00:00:00.000Z" for April 6).
 */

import {
  toLocalDateStr,
  toStartOfDayISO,
  toEndOfDayISO,
} from "./utils";

// ---------------------------------------------------------------------------
// toLocalDateStr
// ---------------------------------------------------------------------------

describe("toLocalDateStr", () => {
  it("defaults to today when called with no argument", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(toLocalDateStr()).toBe(expected);
  });

  it("formats a known local date correctly", () => {
    const date = new Date(2026, 0, 9);
    expect(toLocalDateStr(date)).toBe("2026-01-09");
  });

  it("pads single-digit month and day", () => {
    const date = new Date(2026, 0, 5);
    expect(toLocalDateStr(date)).toBe("2026-01-05");
  });

  it("handles end-of-year date", () => {
    const date = new Date(2025, 11, 31);
    expect(toLocalDateStr(date)).toBe("2025-12-31");
  });

  it("handles Feb 28 on a non-leap year", () => {
    const date = new Date(2025, 1, 28);
    expect(toLocalDateStr(date)).toBe("2025-02-28");
  });

  it("handles Feb 29 on a leap year", () => {
    const date = new Date(2024, 1, 29);
    expect(toLocalDateStr(date)).toBe("2024-02-29");
  });

  it("returns YYYY-MM-DD format (no time component)", () => {
    const result = toLocalDateStr(new Date(2026, 3, 15));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("differs from toISOString() when the UTC date is not the same as local date", () => {
    const utcDate = new Date("2026-01-08T23:30:00.000Z");
    const expected = `${utcDate.getFullYear()}-${String(utcDate.getMonth() + 1).padStart(2, "0")}-${String(utcDate.getDate()).padStart(2, "0")}`;
    expect(toLocalDateStr(utcDate)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// toStartOfDayISO  (pure UTC midnight)
// ---------------------------------------------------------------------------

describe("toStartOfDayISO", () => {
  it("returns empty string for empty input", () => {
    expect(toStartOfDayISO("")).toBe("");
  });

  it("produces an ISO string", () => {
    const result = toStartOfDayISO("2026-01-09");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("returns UTC midnight for the given date", () => {
    expect(toStartOfDayISO("2026-01-09")).toBe("2026-01-09T00:00:00.000Z");
  });

  it("handles month boundary correctly", () => {
    expect(toStartOfDayISO("2026-01-01")).toBe("2026-01-01T00:00:00.000Z");
  });

  it("handles non-leap year boundary", () => {
    expect(toStartOfDayISO("2026-03-01")).toBe("2026-03-01T00:00:00.000Z");
  });

  it("handles leap year boundary", () => {
    expect(toStartOfDayISO("2024-03-01")).toBe("2024-03-01T00:00:00.000Z");
  });

  it("handles end of year", () => {
    expect(toStartOfDayISO("2026-12-31")).toBe("2026-12-31T00:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// toEndOfDayISO  (23:59:59.999 UTC)
// ---------------------------------------------------------------------------

describe("toEndOfDayISO", () => {
  it("returns empty string for empty input", () => {
    expect(toEndOfDayISO("")).toBe("");
  });

  it("produces an ISO string", () => {
    const result = toEndOfDayISO("2026-01-09");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("returns 23:59:59.999 UTC for the given date", () => {
    expect(toEndOfDayISO("2026-01-09")).toBe("2026-01-09T23:59:59.999Z");
  });

  it("handles Jan 1", () => {
    expect(toEndOfDayISO("2026-01-01")).toBe("2026-01-01T23:59:59.999Z");
  });

  it("handles end of year", () => {
    expect(toEndOfDayISO("2026-12-31")).toBe("2026-12-31T23:59:59.999Z");
  });

  it("end-of-day is after start-of-day for the same date", () => {
    const start = new Date(toStartOfDayISO("2026-06-15"));
    const end = new Date(toEndOfDayISO("2026-06-15"));
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it("the window between start and end is exactly 24h - 1ms", () => {
    const start = new Date(toStartOfDayISO("2026-06-15"));
    const end = new Date(toEndOfDayISO("2026-06-15"));
    const diffMs = end.getTime() - start.getTime() + 1;
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });
});
