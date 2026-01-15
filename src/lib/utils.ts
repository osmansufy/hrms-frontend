import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a date string (YYYY-MM-DD) to ISO DateTime string at start of day in business timezone
 * @param dateString - Date in format YYYY-MM-DD (e.g., "2025-12-22")
 * @param timezone - IANA timezone identifier (defaults to "Asia/Dhaka" for backward compatibility)
 * @returns ISO 8601 DateTime string at start of day in the specified timezone
 *
 * @example
 * // For Jan 9, 2026 in Asia/Dhaka (UTC+6)
 * toStartOfDayISO("2026-01-09")
 * // Returns: "2026-01-08T18:00:00.000Z" (which is Jan 9 00:00 in Dhaka)
 * 
 * @deprecated This function uses hardcoded offset. For dynamic timezone support, use timezone from system settings.
 * Proper implementation would require calculating timezone offset dynamically (considering DST).
 */
export function toStartOfDayISO(dateString: string, timezone: string = APP_TIMEZONE): string {
  if (!dateString) return "";

  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split("-").map(Number);

  // TODO: Calculate timezone offset dynamically based on timezone parameter
  // For now, using hardcoded offset for Asia/Dhaka (UTC+6) for backward compatibility
  // Proper implementation would need to handle DST and calculate offset for the specific date
  const offsetHours = timezone === "Asia/Dhaka" ? 6 : 6; // Default to +6 for now
  
  // Create date at midnight in the target timezone
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  // Subtract offset hours to get the UTC time that represents midnight in the timezone
  date.setUTCHours(date.getUTCHours() - offsetHours);

  return date.toISOString();
}

/**
 * Converts a date string (YYYY-MM-DD) to ISO DateTime string at end of day in business timezone
 * @param dateString - Date in format YYYY-MM-DD (e.g., "2025-12-22")
 * @param timezone - IANA timezone identifier (defaults to "Asia/Dhaka" for backward compatibility)
 * @returns ISO 8601 DateTime string at end of day (23:59:59.999) in the specified timezone
 *
 * @example
 * // For Jan 9, 2026 in Asia/Dhaka (UTC+6)
 * toEndOfDayISO("2026-01-09")
 * // Returns: "2026-01-09T17:59:59.999Z" (which is Jan 9 23:59:59.999 in Dhaka)
 * 
 * @deprecated This function uses hardcoded offset. For dynamic timezone support, use timezone from system settings.
 * Proper implementation would require calculating timezone offset dynamically (considering DST).
 */
export function toEndOfDayISO(dateString: string, timezone: string = APP_TIMEZONE): string {
  if (!dateString) return "";

  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split("-").map(Number);

  // TODO: Calculate timezone offset dynamically based on timezone parameter
  // For now, using hardcoded offset for Asia/Dhaka (UTC+6) for backward compatibility
  const offsetHours = timezone === "Asia/Dhaka" ? 6 : 6; // Default to +6 for now
  
  // Create date at end of day (23:59:59.999) in the target timezone
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  // Subtract offset hours to get the UTC time that represents end of day in the timezone
  date.setUTCHours(date.getUTCHours() - offsetHours);

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
 * The default timezone used across the application (fallback)
 * @deprecated Use timezone from system settings via useTimezone hook instead
 */
export const APP_TIMEZONE = "Asia/Dhaka";

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
