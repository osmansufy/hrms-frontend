import { useState, useMemo } from "react";
import { toLocalDateStr } from "@/lib/utils";

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

  switch (preset) {
    case "today": {
      const today = toLocalDateStr(now);
      return { startDate: today, endDate: today };
    }

    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const date = toLocalDateStr(yesterday);
      return { startDate: date, endDate: date };
    }

    case "this-week": {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay(); // local day of week (0=Sun)
      const diff = day === 0 ? -6 : 1 - day; // back to Monday
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      return {
        startDate: toLocalDateStr(startOfWeek),
        endDate: toLocalDateStr(now),
      };
    }

    case "last-week": {
      const lastWeekEnd = new Date(now);
      const day = lastWeekEnd.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      lastWeekEnd.setDate(lastWeekEnd.getDate() + diffToMonday - 1); // Sunday of last week

      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Monday of last week

      return {
        startDate: toLocalDateStr(lastWeekStart),
        endDate: toLocalDateStr(lastWeekEnd),
      };
    }

    case "this-month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: toLocalDateStr(startOfMonth),
        endDate: toLocalDateStr(now),
      };
    }

    case "last-month": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: toLocalDateStr(lastMonth),
        endDate: toLocalDateStr(lastMonthEnd),
      };
    }

    case "this-year": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: toLocalDateStr(startOfYear),
        endDate: toLocalDateStr(now),
      };
    }

    case "custom":
    default: {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: toLocalDateStr(startOfMonth),
        endDate: toLocalDateStr(now),
      };
    }
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
