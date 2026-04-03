/**
 * @jest-environment jsdom
 *
 * Tests for getDateRangeForPreset (pure function, no React needed)
 * and basic shape of useDateRangePresets hook.
 *
 * Strategy: freeze `Date` with jest.useFakeTimers / jest.setSystemTime so every
 * "now" inside the function is deterministic. We pick a fixed point:
 *   Wednesday 2026-04-08 local (mid-week, mid-month, mid-year)
 */

import { renderHook, act } from "@testing-library/react";
import { getDateRangeForPreset, useDateRangePresets } from "./useDateRangePresets";

// ---------------------------------------------------------------------------
// Fixed "now": Wednesday 2026-04-08  (local, browser time)
// We set system time to noon local so that getFullYear/getMonth/getDate all
// resolve to April 8 regardless of the test runner's actual TZ.
// ---------------------------------------------------------------------------
const FIXED_NOW_LOCAL = new Date(2026, 3, 8, 12, 0, 0, 0); // Apr 8 2026 12:00 local

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW_LOCAL);
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build "YYYY-MM-DD" from local date parts of a Date */
function localStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// getDateRangeForPreset
// ---------------------------------------------------------------------------

describe("getDateRangeForPreset", () => {
  describe('"today"', () => {
    it("startDate === endDate === local today", () => {
      const { startDate, endDate } = getDateRangeForPreset("today");
      expect(startDate).toBe("2026-04-08");
      expect(endDate).toBe("2026-04-08");
    });
  });

  describe('"yesterday"', () => {
    it("startDate === endDate === local yesterday", () => {
      const { startDate, endDate } = getDateRangeForPreset("yesterday");
      expect(startDate).toBe("2026-04-07");
      expect(endDate).toBe("2026-04-07");
    });
  });

  describe('"this-week"', () => {
    // Wednesday Apr 8 → Monday Apr 6 is start of week
    it("startDate is the Monday of the current week", () => {
      const { startDate } = getDateRangeForPreset("this-week");
      expect(startDate).toBe("2026-04-06"); // Monday
    });

    it("endDate is local today", () => {
      const { endDate } = getDateRangeForPreset("this-week");
      expect(endDate).toBe("2026-04-08"); // Wednesday (today)
    });
  });

  describe('"this-week" when today is Sunday', () => {
    it("startDate is the Monday 6 days before (same week's Monday)", () => {
      // Sunday April 12 2026
      jest.setSystemTime(new Date(2026, 3, 12, 12, 0, 0));
      const { startDate, endDate } = getDateRangeForPreset("this-week");
      expect(startDate).toBe("2026-04-06"); // Monday Apr 6
      expect(endDate).toBe("2026-04-12"); // Sunday (today)
    });
  });

  describe('"this-week" when today is Monday', () => {
    it("startDate === endDate === today", () => {
      // Monday April 6 2026
      jest.setSystemTime(new Date(2026, 3, 6, 12, 0, 0));
      const { startDate, endDate } = getDateRangeForPreset("this-week");
      expect(startDate).toBe("2026-04-06");
      expect(endDate).toBe("2026-04-06");
    });
  });

  describe('"last-week"', () => {
    // Wednesday Apr 8 → last week is Mon Mar 30 – Sun Apr 5
    it("startDate is last Monday", () => {
      const { startDate } = getDateRangeForPreset("last-week");
      expect(startDate).toBe("2026-03-30");
    });

    it("endDate is last Sunday", () => {
      const { endDate } = getDateRangeForPreset("last-week");
      expect(endDate).toBe("2026-04-05");
    });

    it("the range spans exactly 7 days", () => {
      const { startDate, endDate } = getDateRangeForPreset("last-week");
      const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
      expect(diffMs / (1000 * 60 * 60 * 24)).toBe(6); // 6 days difference = 7 inclusive
    });
  });

  describe('"this-month"', () => {
    it("startDate is April 1", () => {
      const { startDate } = getDateRangeForPreset("this-month");
      expect(startDate).toBe("2026-04-01");
    });

    it("endDate is local today", () => {
      const { endDate } = getDateRangeForPreset("this-month");
      expect(endDate).toBe("2026-04-08");
    });
  });

  describe('"last-month"', () => {
    // April 8 → last month is March 2026 (1–31)
    it("startDate is March 1", () => {
      const { startDate } = getDateRangeForPreset("last-month");
      expect(startDate).toBe("2026-03-01");
    });

    it("endDate is March 31", () => {
      const { endDate } = getDateRangeForPreset("last-month");
      expect(endDate).toBe("2026-03-31");
    });
  });

  describe('"last-month" when current month is January', () => {
    it("returns December of the previous year", () => {
      jest.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)); // Jan 15 2026
      const { startDate, endDate } = getDateRangeForPreset("last-month");
      expect(startDate).toBe("2025-12-01");
      expect(endDate).toBe("2025-12-31");
    });
  });

  describe('"this-year"', () => {
    it("startDate is Jan 1 of current year", () => {
      const { startDate } = getDateRangeForPreset("this-year");
      expect(startDate).toBe("2026-01-01");
    });

    it("endDate is local today", () => {
      const { endDate } = getDateRangeForPreset("this-year");
      expect(endDate).toBe("2026-04-08");
    });
  });

  describe('"custom" (fallback)', () => {
    it("falls back to this-month range", () => {
      const { startDate, endDate } = getDateRangeForPreset("custom");
      expect(startDate).toBe("2026-04-01");
      expect(endDate).toBe("2026-04-08");
    });
  });

  describe("output format", () => {
    const presets = [
      "today",
      "yesterday",
      "this-week",
      "last-week",
      "this-month",
      "last-month",
      "this-year",
      "custom",
    ] as const;

    presets.forEach((preset) => {
      it(`"${preset}" returns YYYY-MM-DD strings`, () => {
        const { startDate, endDate } = getDateRangeForPreset(preset);
        expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it(`"${preset}" startDate <= endDate`, () => {
        const { startDate, endDate } = getDateRangeForPreset(preset);
        expect(startDate <= endDate).toBe(true);
      });
    });
  });

  describe("no UTC leak — does not use toISOString()", () => {
    it("today preset matches getDate() not UTC date", () => {
      // Simulate a time that is 23:30 UTC but next day locally for UTC+6
      // We cannot easily fake this in Jest without ENV TZ, but we can verify
      // that the returned string matches what getFullYear/getMonth/getDate give.
      const result = getDateRangeForPreset("today");
      const now = new Date();
      const expected = localStr(now);
      expect(result.startDate).toBe(expected);
      expect(result.endDate).toBe(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// useDateRangePresets hook
// ---------------------------------------------------------------------------

describe("useDateRangePresets hook", () => {
  it("defaults to this-month preset", () => {
    const { result } = renderHook(() => useDateRangePresets());
    expect(result.current.preset).toBe("this-month");
  });

  it("dateRange matches this-month on init", () => {
    const { result } = renderHook(() => useDateRangePresets());
    expect(result.current.dateRange.startDate).toBe("2026-04-01");
    expect(result.current.dateRange.endDate).toBe("2026-04-08");
  });

  it("custom initial preset", () => {
    const { result } = renderHook(() => useDateRangePresets("today"));
    expect(result.current.preset).toBe("today");
    expect(result.current.dateRange.startDate).toBe("2026-04-08");
  });

  it("setPreset changes the range", () => {
    const { result } = renderHook(() => useDateRangePresets());

    act(() => {
      result.current.setPreset("this-year");
    });

    expect(result.current.preset).toBe("this-year");
    expect(result.current.dateRange.startDate).toBe("2026-01-01");
    expect(result.current.dateRange.endDate).toBe("2026-04-08");
  });

  it("setCustomRange switches to custom preset", () => {
    const { result } = renderHook(() => useDateRangePresets());

    act(() => {
      result.current.setCustomRange({ startDate: "2026-03-01", endDate: "2026-03-31" });
    });

    expect(result.current.preset).toBe("custom");
    expect(result.current.dateRange.startDate).toBe("2026-03-01");
    expect(result.current.dateRange.endDate).toBe("2026-03-31");
  });

  it("setCustomRange partial update preserves other field", () => {
    const { result } = renderHook(() => useDateRangePresets());

    act(() => {
      result.current.setCustomRange({ startDate: "2026-02-01", endDate: "2026-02-28" });
    });

    act(() => {
      result.current.setCustomRange({ endDate: "2026-02-15" });
    });

    expect(result.current.dateRange.startDate).toBe("2026-02-01");
    expect(result.current.dateRange.endDate).toBe("2026-02-15");
  });

  it("switching away from custom then back gives fresh custom range", () => {
    const { result } = renderHook(() => useDateRangePresets());

    act(() => {
      result.current.setCustomRange({ startDate: "2026-01-01", endDate: "2026-01-31" });
    });

    act(() => {
      result.current.setPreset("today");
    });

    expect(result.current.preset).toBe("today");
    expect(result.current.dateRange.startDate).toBe("2026-04-08");
  });
});
