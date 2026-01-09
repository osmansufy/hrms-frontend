import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a date string (YYYY-MM-DD) to ISO DateTime string at start of day in business timezone (Asia/Dhaka)
 * @param dateString - Date in format YYYY-MM-DD (e.g., "2025-12-22")
 * @returns ISO 8601 DateTime string at start of day in Asia/Dhaka timezone (UTC+6)
 *
 * @example
 * // For Jan 9, 2026 in Asia/Dhaka (UTC+6)
 * toStartOfDayISO("2026-01-09")
 * // Returns: "2026-01-08T18:00:00.000Z" (which is Jan 9 00:00 in Dhaka)
 */
export function toStartOfDayISO(dateString: string): string {
  if (!dateString) return "";

  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split("-").map(Number);

  // Create date at midnight in Asia/Dhaka timezone (UTC+6)
  // We need to create a UTC date that represents midnight in Dhaka
  // Dhaka is UTC+6, so midnight in Dhaka = 18:00 previous day in UTC
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  // Subtract 6 hours to get the UTC time that represents midnight in Dhaka
  date.setUTCHours(date.getUTCHours() - 6);

  return date.toISOString();
}

/**
 * Converts a date string (YYYY-MM-DD) to ISO DateTime string at end of day in business timezone (Asia/Dhaka)
 * @param dateString - Date in format YYYY-MM-DD (e.g., "2025-12-22")
 * @returns ISO 8601 DateTime string at end of day (23:59:59.999) in Asia/Dhaka timezone (UTC+6)
 *
 * @example
 * // For Jan 9, 2026 in Asia/Dhaka (UTC+6)
 * toEndOfDayISO("2026-01-09")
 * // Returns: "2026-01-09T17:59:59.999Z" (which is Jan 9 23:59:59.999 in Dhaka)
 */
export function toEndOfDayISO(dateString: string): string {
  if (!dateString) return "";

  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split("-").map(Number);

  // Create date at end of day (23:59:59.999) in Asia/Dhaka timezone (UTC+6)
  // Dhaka is UTC+6, so 23:59:59.999 in Dhaka = 17:59:59.999 same day in UTC
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  // Subtract 6 hours to get the UTC time that represents end of day in Dhaka
  date.setUTCHours(date.getUTCHours() - 6);

  return date.toISOString();
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
 * The timezone used across the application
 */
export const APP_TIMEZONE = "Asia/Dhaka";

/**
 * Formats a date/time string to Asia/Dhaka timezone
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date/time string in Asia/Dhaka timezone
 */
export function formatInDhakaTimezone(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateString) return "—";
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleString("en-US", {
      ...options,
      timeZone: APP_TIMEZONE,
    });
  } catch {
    return "—";
  }
}

/**
 * Formats a date to Asia/Dhaka timezone (date only)
 * @param dateString - ISO date string or Date object
 * @param format - "short" (e.g., "Jan 5") | "long" (e.g., "Jan 5, 2026") | "full" (e.g., "January 5, 2026")
 * @returns Formatted date string
 */
export function formatDateInDhaka(
  dateString: string | Date,
  format: "short" | "long" | "full" = "short"
): string {
  if (!dateString) return "—";

  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { month: "short", day: "numeric" }
      : format === "long"
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" };

  return formatInDhakaTimezone(dateString, options);
}

/**
 * Formats a time to Asia/Dhaka timezone (time only)
 * @param dateString - ISO date string or Date object
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted time string (e.g., "02:30 PM" or "14:30:00")
 */
export function formatTimeInDhaka(
  dateString: string | Date,
  includeSeconds = false
): string {
  if (!dateString) return "—";

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds && { second: "2-digit" }),
  };

  return formatInDhakaTimezone(dateString, options);
}

/**
 * Formats a date and time to Asia/Dhaka timezone
 * @param dateString - ISO date string or Date object
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted date and time string
 */
export function formatDateTimeInDhaka(
  dateString: string | Date,
  includeSeconds = false
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

  return formatInDhakaTimezone(dateString, options);
}
