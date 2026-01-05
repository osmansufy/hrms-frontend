import { useState, useMemo } from "react";

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
      const today = formatDate(now);
      return { startDate: today, endDate: today };
    }

    case "yesterday": {
      const yesterday = new Date(now);
      // Use UTC for consistent date arithmetic
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const date = formatDate(yesterday);
      return { startDate: date, endDate: date };
    }

    case "this-week": {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getUTCDay();
      const diff = startOfWeek.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setUTCDate(diff);

      return {
        startDate: formatDate(startOfWeek),
        endDate: formatDate(now),
      };
    }

    case "last-week": {
      const lastWeekEnd = new Date(now);
      const day = lastWeekEnd.getUTCDay();
      const diff = lastWeekEnd.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday of this week
      lastWeekEnd.setUTCDate(diff - 1); // Sunday of last week

      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setUTCDate(lastWeekEnd.getUTCDate() - 6); // Monday of last week

      return {
        startDate: formatDate(lastWeekStart),
        endDate: formatDate(lastWeekEnd),
      };
    }

    case "this-month": {
      const startOfMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      );
      return {
        startDate: formatDate(startOfMonth),
        endDate: formatDate(now),
      };
    }

    case "last-month": {
      const lastMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
      );
      const lastMonthEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)
      );
      return {
        startDate: formatDate(lastMonth),
        endDate: formatDate(lastMonthEnd),
      };
    }

    case "this-year": {
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      return {
        startDate: formatDate(startOfYear),
        endDate: formatDate(now),
      };
    }

    case "custom":
    default: {
      // Default to this month
      const startOfMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      );
      return {
        startDate: formatDate(startOfMonth),
        endDate: formatDate(now),
      };
    }
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
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
