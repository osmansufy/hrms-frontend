import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a date string (YYYY-MM-DD) to its pure UTC-midnight ISO string.
 * The backend stores calendar dates at UTC midnight (e.g. "2026-04-06T00:00:00.000Z"
 * for April 6), so query parameters should use the same format.
 *
 * @param dateString - Date in format YYYY-MM-DD
 * @returns ISO 8601 DateTime string at UTC midnight
 *
 * @example
 * toStartOfDayISO("2026-01-09")
 * // => "2026-01-09T00:00:00.000Z"
 */
export function toStartOfDayISO(dateString: string, _timezone?: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

/**
 * Converts a date string (YYYY-MM-DD) to end-of-day in UTC
 * (23:59:59.999Z on the same calendar date).
 *
 * @param dateString - Date in format YYYY-MM-DD
 * @returns ISO 8601 DateTime string at 23:59:59.999 UTC
 *
 * @example
 * toEndOfDayISO("2026-01-09")
 * // => "2026-01-09T23:59:59.999Z"
 */
export function toEndOfDayISO(dateString: string, _timezone?: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
}

/**
 * Formats minutes into human-readable hour:minute format
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "8h 30m")
 */
export function formatMinutesToHours(minutes: number): string {
  if (!minutes || minutes === 0) return "0h";

  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";

  if (mins === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h ${mins}m`;
}

/**
 * The default timezone used across the application (fallback)
 * @deprecated Use timezone from system settings via useTimezone hook instead
 */
export const APP_TIMEZONE = "Asia/Dhaka";

/**
 * Returns a date as a YYYY-MM-DD string using the browser's LOCAL timezone.
 * Always use this instead of `date.toISOString().split('T')[0]` when building
 * API query params or date-input values — toISOString() is always UTC and will
 * produce the wrong calendar day for Dhaka users between 00:00–05:59 local time.
 *
 * @param date - Date to format (defaults to now)
 * @returns "YYYY-MM-DD" in the user's local timezone
 */
export function toLocalDateStr(date: Date = new Date()): string {
  const y   = date.getFullYear();
  const m   = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Formats a date/time string to a specific timezone
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @param timezone - IANA timezone identifier (defaults to "Asia/Dhaka" for backward compatibility)
 * @returns Formatted date/time string in the specified timezone
 */
export function formatInTimezone(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  timezone: string = APP_TIMEZONE
): string {
  if (!dateString) return "—";
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleString("en-US", {
      ...options,
      timeZone: timezone,
    });
  } catch {
    return "—";
  }
}

/**
 * Formats a date/time string to Asia/Dhaka timezone
 * @deprecated Use formatInTimezone with timezone from useTimezone hook instead
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date/time string in Asia/Dhaka timezone
 */
export function formatInDhakaTimezone(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return formatInTimezone(dateString, options, APP_TIMEZONE);
}

/**
 * Formats a date to a specific timezone (date only)
 * @param dateString - ISO date string or Date object
 * @param format - "short" (e.g., "Jan 5") | "long" (e.g., "Jan 5, 2026") | "full" (e.g., "January 5, 2026")
 * @param timezone - IANA timezone identifier (defaults to "Asia/Dhaka" for backward compatibility)
 * @returns Formatted date string
 */
export function formatDateInTimezone(
  dateString: string | Date,
  format: "short" | "long" | "full" = "short",
  timezone: string = APP_TIMEZONE
): string {
  if (!dateString) return "—";

  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { month: "short", day: "numeric" }
      : format === "long"
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" };

  return formatInTimezone(dateString, options, timezone);
}

/**
 * Formats a date to Asia/Dhaka timezone (date only)
 * @deprecated Use formatDateInTimezone with timezone from useTimezone hook instead
 * @param dateString - ISO date string or Date object
 * @param format - "short" (e.g., "Jan 5") | "long" (e.g., "Jan 5, 2026") | "full" (e.g., "January 5, 2026")
 * @returns Formatted date string
 */
export function formatDateInDhaka(
  dateString: string | Date,
  format: "short" | "long" | "full" = "short"
): string {
  return formatDateInTimezone(dateString, format, APP_TIMEZONE);
}

/**
 * Formats a time to a specific timezone (time only)
 * @param dateString - ISO date string or Date object
 * @param includeSeconds - Whether to include seconds
 * @param timezone - IANA timezone identifier (defaults to "Asia/Dhaka" for backward compatibility)
 * @returns Formatted time string (e.g., "02:30 PM" or "14:30:00")
 */
export function formatTimeInTimezone(
  dateString: string | Date,
  includeSeconds = false,
  timezone: string = APP_TIMEZONE
): string {
  if (!dateString) return "—";

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds && { second: "2-digit" }),
  };

  return formatInTimezone(dateString, options, timezone);
}

/**
 * Formats a time to Asia/Dhaka timezone (time only)
 * @deprecated Use formatTimeInTimezone with timezone from useTimezone hook instead
 * @param dateString - ISO date string or Date object
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted time string (e.g., "02:30 PM" or "14:30:00")
 */
export function formatTimeInDhaka(
  dateString: string | Date,
  includeSeconds = false
): string {
  return formatTimeInTimezone(dateString, includeSeconds, APP_TIMEZONE);
}

/**
 * Formats a date and time to a specific timezone
 * @param dateString - ISO date string or Date object
 * @param includeSeconds - Whether to include seconds
 * @param timezone - IANA timezone identifier (defaults to "Asia/Dhaka" for backward compatibility)
 * @returns Formatted date and time string
 */
export function formatDateTimeInTimezone(
  dateString: string | Date,
  includeSeconds = false,
  timezone: string = APP_TIMEZONE
): string {
  if (!dateString) return "—";

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds && { second: "2-digit" }),
  };

  return formatInTimezone(dateString, options, timezone);
}

/**
 * Formats a date and time to Asia/Dhaka timezone
 * @deprecated Use formatDateTimeInTimezone with timezone from useTimezone hook instead
 * @param dateString - ISO date string or Date object
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted date and time string
 */
export function formatDateTimeInDhaka(
  dateString: string | Date,
  includeSeconds = false
): string {
  return formatDateTimeInTimezone(dateString, includeSeconds, APP_TIMEZONE);
}
