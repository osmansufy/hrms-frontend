"use client";

import { useTimezone } from "@/contexts/timezone-context";
import {
  formatInTimezone,
  formatDateInTimezone,
  formatTimeInTimezone,
  formatDateTimeInTimezone,
} from "@/lib/utils";

/**
 * Hook that provides timezone-aware formatting functions
 * These functions automatically use the timezone from system settings
 */
export function useTimezoneFormatters() {
  const { timezone } = useTimezone();

  return {
    timezone,
    formatInTimezone: (
      dateString: string | Date,
      options?: Intl.DateTimeFormatOptions
    ) => formatInTimezone(dateString, options, timezone),
    formatDate: (
      dateString: string | Date,
      format?: "short" | "long" | "full"
    ) => formatDateInTimezone(dateString, format, timezone),
    formatTime: (dateString: string | Date, includeSeconds?: boolean) =>
      formatTimeInTimezone(dateString, includeSeconds, timezone),
    formatDateTime: (dateString: string | Date, includeSeconds?: boolean) =>
      formatDateTimeInTimezone(dateString, includeSeconds, timezone),
  };
}
