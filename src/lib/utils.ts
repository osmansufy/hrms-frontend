import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a date string (YYYY-MM-DD) to ISO DateTime string at start of day in user's timezone
 * @param dateString - Date in format YYYY-MM-DD (e.g., "2025-12-22")
 * @returns ISO 8601 DateTime string (e.g., "2025-12-22T00:00:00.000Z" or "2025-12-21T18:30:00.000Z" for GMT+5:30)
 *
 * @example
 * // User in GMT+5:30 (India) selects Dec 22, 2025
 * toStartOfDayISO("2025-12-22")
 * // Returns: "2025-12-21T18:30:00.000Z" (which is Dec 22 00:00 in India)
 */
export function toStartOfDayISO(dateString: string): string {
  if (!dateString) return "";

  // Create date in user's local timezone at midnight
  const date = new Date(dateString + "T00:00:00");

  // Convert to ISO string (UTC)
  return date.toISOString();
}

/**
 * Converts a date string (YYYY-MM-DD) to ISO DateTime string at end of day in user's timezone
 * @param dateString - Date in format YYYY-MM-DD (e.g., "2025-12-22")
 * @returns ISO 8601 DateTime string at 23:59:59.999
 *
 * @example
 * // User in GMT+5:30 (India) selects Dec 22, 2025
 * toEndOfDayISO("2025-12-22")
 * // Returns: "2025-12-22T18:29:59.999Z" (which is Dec 22 23:59:59.999 in India)
 */
export function toEndOfDayISO(dateString: string): string {
  if (!dateString) return "";

  // Create date in user's local timezone at 23:59:59.999
  const date = new Date(dateString + "T23:59:59.999");

  // Convert to ISO string (UTC)
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
