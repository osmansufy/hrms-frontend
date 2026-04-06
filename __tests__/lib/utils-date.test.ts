import {
  toStartOfDayISO,
  toEndOfDayISO,
  toLocalDateStr,
  formatMinutesToHours,
} from "@/lib/utils";

describe("toLocalDateStr", () => {
  it("returns YYYY-MM-DD using browser local calendar", () => {
    const date = new Date(2026, 3, 6); // April 6, 2026 in local TZ
    expect(toLocalDateStr(date)).toBe("2026-04-06");
  });

  it("pads single-digit month and day", () => {
    const date = new Date(2026, 0, 5); // Jan 5
    expect(toLocalDateStr(date)).toBe("2026-01-05");
  });

  it("defaults to current date when no argument", () => {
    const result = toLocalDateStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("toStartOfDayISO", () => {
  it("returns empty string for empty input", () => {
    expect(toStartOfDayISO("")).toBe("");
  });

  it("returns ISO string for Asia/Dhaka (UTC+6) — midnight = UTC-6h", () => {
    const result = toStartOfDayISO("2026-01-09", "Asia/Dhaka");
    const d = new Date(result);
    expect(d.getUTCHours()).toBe(18);
    expect(d.getUTCDate()).toBe(8);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
    expect(d.getUTCMilliseconds()).toBe(0);
  });

  it("returns ISO string for UTC — midnight = UTC midnight", () => {
    const result = toStartOfDayISO("2026-06-15", "UTC");
    const d = new Date(result);
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("handles Asia/Kolkata (UTC+5:30) fractional offset", () => {
    const result = toStartOfDayISO("2026-03-01", "Asia/Kolkata");
    const d = new Date(result);
    // Midnight Kolkata = 18:30 UTC previous day
    expect(d.getUTCDate()).toBe(28); // Feb 28
    expect(d.getUTCHours()).toBe(18);
    expect(d.getUTCMinutes()).toBe(30);
  });

  it("handles negative offset (America/New_York in winter = UTC-5)", () => {
    const result = toStartOfDayISO("2026-01-15", "America/New_York");
    const d = new Date(result);
    // Midnight EST = 05:00 UTC same day
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(5);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("handles DST transition (America/New_York summer = UTC-4)", () => {
    const result = toStartOfDayISO("2026-07-15", "America/New_York");
    const d = new Date(result);
    // Midnight EDT = 04:00 UTC same day
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(4);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("defaults to Asia/Dhaka when no timezone specified", () => {
    const withTz = toStartOfDayISO("2026-04-06", "Asia/Dhaka");
    const withoutTz = toStartOfDayISO("2026-04-06");
    expect(withTz).toBe(withoutTz);
  });
});

describe("toEndOfDayISO", () => {
  it("returns empty string for empty input", () => {
    expect(toEndOfDayISO("")).toBe("");
  });

  it("returns 23:59:59.999 local = correct UTC for Asia/Dhaka", () => {
    const result = toEndOfDayISO("2026-01-09", "Asia/Dhaka");
    const d = new Date(result);
    // 23:59:59.999 Dhaka = 17:59:59.999 UTC
    expect(d.getUTCDate()).toBe(9);
    expect(d.getUTCHours()).toBe(17);
    expect(d.getUTCMinutes()).toBe(59);
    expect(d.getUTCSeconds()).toBe(59);
    expect(d.getUTCMilliseconds()).toBe(999);
  });

  it("returns 23:59:59.999 UTC for UTC timezone", () => {
    const result = toEndOfDayISO("2026-06-15", "UTC");
    const d = new Date(result);
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(23);
    expect(d.getUTCMinutes()).toBe(59);
    expect(d.getUTCSeconds()).toBe(59);
    expect(d.getUTCMilliseconds()).toBe(999);
  });

  it("handles Asia/Kolkata (UTC+5:30) correctly", () => {
    const result = toEndOfDayISO("2026-03-01", "Asia/Kolkata");
    const d = new Date(result);
    // 23:59:59.999 IST = 18:29:59.999 UTC
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCHours()).toBe(18);
    expect(d.getUTCMinutes()).toBe(29);
    expect(d.getUTCSeconds()).toBe(59);
  });

  it("start < end for the same date", () => {
    const start = new Date(toStartOfDayISO("2026-04-06", "Asia/Dhaka"));
    const end = new Date(toEndOfDayISO("2026-04-06", "Asia/Dhaka"));
    expect(end.getTime() - start.getTime()).toBeCloseTo(24 * 60 * 60 * 1000 - 1, -2);
  });
});

describe("formatMinutesToHours", () => {
  it('returns "0h" for 0 minutes', () => {
    expect(formatMinutesToHours(0)).toBe("0h");
  });

  it("returns hours only when no remainder", () => {
    expect(formatMinutesToHours(120)).toBe("2h");
  });

  it("returns hours and minutes", () => {
    expect(formatMinutesToHours(150)).toBe("2h 30m");
  });

  it("handles negative values with a sign", () => {
    expect(formatMinutesToHours(-90)).toBe("-1h 30m");
  });

  it("handles minutes less than 60", () => {
    expect(formatMinutesToHours(45)).toBe("0h 45m");
  });
});
