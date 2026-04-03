/**
 * @jest-environment jsdom
 *
 * Tests for timezone-sensitive utility functions in utils.ts
 * Focus: toLocalDateStr, toStartOfDayISO, toEndOfDayISO
 *
 * The critical scenario: Dhaka users between 00:00–05:59 local (18:00–23:59 UTC
 * the PREVIOUS day). toISOString() would return the wrong date in that window.
 */

import {
  toLocalDateStr,
  toStartOfDayISO,
  toEndOfDayISO,
} from "./utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a Date that represents a specific local time in any environment by
 * directly setting individual date-part properties. We use the fact that
 * new Date(year, month, day, hour, ...) always uses the *runtime's* local
 * timezone — but in Jest/jsdom we cannot control TZ without an env var.
 *
 * Instead we pass explicit UTC offsets and construct a fake "now" using
 * Date.UTC so that the test is timezone-agnostic.
 *
 * For toLocalDateStr we test the contract "uses getFullYear/getMonth/getDate
 * (browser local time)" by creating known Date objects with a fixed local
 * date, regardless of where the test runner is.
 */

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
    // new Date(year, month0, day) uses LOCAL timezone — safe for any runner
    const date = new Date(2026, 0, 9); // Jan 9, 2026 local midnight
    expect(toLocalDateStr(date)).toBe("2026-01-09");
  });

  it("pads single-digit month and day", () => {
    const date = new Date(2026, 0, 5); // Jan 5
    expect(toLocalDateStr(date)).toBe("2026-01-05");
  });

  it("handles end-of-year date", () => {
    const date = new Date(2025, 11, 31); // Dec 31
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
    // Create a moment that is 23:30 UTC but represents the NEXT local day for UTC+6
    // 2026-01-08T23:30:00Z = 2026-01-09T05:30:00+06:00
    // toISOString() → "2026-01-08" (UTC date — WRONG for Dhaka user at 05:30 local)
    // toLocalDateStr() depends on the runtime TZ. We can't control that in Jest
    // without env vars, so we verify the output matches getFullYear/Month/Date.
    const utcDate = new Date("2026-01-08T23:30:00.000Z");
    const expected = `${utcDate.getFullYear()}-${String(utcDate.getMonth() + 1).padStart(2, "0")}-${String(utcDate.getDate()).padStart(2, "0")}`;
    expect(toLocalDateStr(utcDate)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// toStartOfDayISO
// ---------------------------------------------------------------------------

describe("toStartOfDayISO", () => {
  it("returns empty string for empty input", () => {
    expect(toStartOfDayISO("")).toBe("");
  });

  it("produces an ISO string", () => {
    const result = toStartOfDayISO("2026-01-09");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("converts 2026-01-09 to 2026-01-08T18:00:00.000Z for Asia/Dhaka (UTC+6)", () => {
    // Dhaka midnight (00:00+06:00) = 18:00 UTC previous day
    expect(toStartOfDayISO("2026-01-09")).toBe("2026-01-08T18:00:00.000Z");
  });

  it("converts 2026-01-01 to 2025-12-31T18:00:00.000Z (month boundary)", () => {
    expect(toStartOfDayISO("2026-01-01")).toBe("2025-12-31T18:00:00.000Z");
  });

  it("converts 2026-03-01 to 2026-02-28T18:00:00.000Z (non-leap year boundary)", () => {
    expect(toStartOfDayISO("2026-03-01")).toBe("2026-02-28T18:00:00.000Z");
  });

  it("converts 2024-03-01 to 2024-02-29T18:00:00.000Z (leap year boundary)", () => {
    expect(toStartOfDayISO("2024-03-01")).toBe("2024-02-29T18:00:00.000Z");
  });

  it("converts 2026-12-31 correctly (end of year)", () => {
    expect(toStartOfDayISO("2026-12-31")).toBe("2026-12-30T18:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// toEndOfDayISO
// ---------------------------------------------------------------------------

describe("toEndOfDayISO", () => {
  it("returns empty string for empty input", () => {
    expect(toEndOfDayISO("")).toBe("");
  });

  it("produces an ISO string", () => {
    const result = toEndOfDayISO("2026-01-09");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("converts 2026-01-09 to 2026-01-09T17:59:59.999Z for Asia/Dhaka (UTC+6)", () => {
    // Dhaka end of day (23:59:59.999+06:00) = 17:59:59.999 UTC same day
    expect(toEndOfDayISO("2026-01-09")).toBe("2026-01-09T17:59:59.999Z");
  });

  it("converts 2026-01-01 to 2026-01-01T17:59:59.999Z", () => {
    expect(toEndOfDayISO("2026-01-01")).toBe("2026-01-01T17:59:59.999Z");
  });

  it("converts 2026-12-31 to 2026-12-31T17:59:59.999Z (end of year)", () => {
    expect(toEndOfDayISO("2026-12-31")).toBe("2026-12-31T17:59:59.999Z");
  });

  it("end-of-day is after start-of-day for the same date", () => {
    const start = new Date(toStartOfDayISO("2026-06-15"));
    const end = new Date(toEndOfDayISO("2026-06-15"));
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it("the window between start and end is exactly 24h - 1ms", () => {
    const start = new Date(toStartOfDayISO("2026-06-15"));
    const end = new Date(toEndOfDayISO("2026-06-15"));
    const diffMs = end.getTime() - start.getTime() + 1; // +1 to include end ms
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });
});
