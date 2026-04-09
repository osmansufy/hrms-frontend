import { useState, useMemo } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
} from "date-fns";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "this-year"
  | "custom";

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export function useDateRangePresets(
  initialPreset: DateRangePreset = "this-month"
) {
  const [preset, setPreset] = useState<DateRangePreset>(initialPreset);
  const [customRange, setCustomRange] = useState<DateRange>(() =>
    getDateRangeForPreset("this-month")
  );

  const dateRange = useMemo(() => {
    if (preset === "custom") {
      return customRange;
    }
    return getDateRangeForPreset(preset);
  }, [preset, customRange]);

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setCustomRange(getDateRangeForPreset(newPreset));
    }
  };

  const handleCustomRangeChange = (range: Partial<DateRange>) => {
    setCustomRange((prev) => ({ ...prev, ...range }));
    setPreset("custom");
  };

  return {
    preset,
    dateRange,
    setPreset: handlePresetChange,
    setCustomRange: handleCustomRangeChange,
  };
}

export function getDateRangeForPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  switch (preset) {
    case "today": {
      const today = fmt(now);
      return { startDate: today, endDate: today };
    }

    case "yesterday": {
      const date = fmt(subDays(now, 1));
      return { startDate: date, endDate: date };
    }

    case "this-week":
      return {
        startDate: fmt(startOfWeek(now, { weekStartsOn: 1 })),
        endDate: fmt(now),
      };

    case "last-week": {
      const lastWeek = subDays(now, 7);
      return {
        startDate: fmt(startOfWeek(lastWeek, { weekStartsOn: 1 })),
        endDate: fmt(endOfWeek(lastWeek, { weekStartsOn: 1 })),
      };
    }

    case "this-month":
      return {
        startDate: fmt(startOfMonth(now)),
        endDate: fmt(now),
      };

    case "last-month": {
      const lastMonth = subMonths(now, 1);
      return {
        startDate: fmt(startOfMonth(lastMonth)),
        endDate: fmt(endOfMonth(lastMonth)),
      };
    }

    case "this-year":
      return {
        startDate: fmt(startOfYear(now)),
        endDate: fmt(now),
      };

    case "custom":
    default:
      return {
        startDate: fmt(startOfMonth(now)),
        endDate: fmt(now),
      };
  }
}

export const DATE_RANGE_PRESETS: Array<{
  value: DateRangePreset;
  label: string;
}> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "last-week", label: "Last Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];
