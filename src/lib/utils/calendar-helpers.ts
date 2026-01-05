export type CalendarLeave = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  leaveTypeName: string;
  leaveTypeCode: string;
};

export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  leaves: CalendarLeave[];
  isPast: boolean;
};

/**
 * Generate calendar grid for a given month
 */
export function generateCalendarGrid(
  year: number,
  month: number
): CalendarDay[][] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Get the day of week (0 = Sunday, 6 = Saturday)
  const startDay = firstDayOfMonth.getDay();

  // Calculate start date (may be in previous month)
  const calendarStart = new Date(firstDayOfMonth);
  calendarStart.setDate(calendarStart.getDate() - startDay);

  // Generate 42 days (6 weeks)
  const daysInCalendar = 42;
  const allDays: Date[] = [];
  for (let i = 0; i < daysInCalendar; i++) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + i);
    allDays.push(date);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert to CalendarDay objects
  const calendarDays: CalendarDay[] = allDays.map((date: Date) => ({
    date,
    isCurrentMonth: date.getMonth() === month,
    leaves: [],
    isPast: date < today,
  }));

  // Group into weeks (arrays of 7 days)
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return weeks;
}

/**
 * Map leaves to calendar days
 */
export function mapLeavesToCalendar(
  calendarGrid: CalendarDay[][],
  leaves: CalendarLeave[]
): CalendarDay[][] {
  return calendarGrid.map((week) =>
    week.map((day) => {
      // Find leaves that include this day
      const leavesForDay = leaves.filter((leave) => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);

        // Normalize dates to midnight for comparison
        const dayNormalized = new Date(day.date);
        dayNormalized.setHours(0, 0, 0, 0);
        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(0, 0, 0, 0);

        // Check if day falls within leave range
        return dayNormalized >= leaveStart && dayNormalized <= leaveEnd;
      });

      return {
        ...day,
        leaves: leavesForDay,
      };
    })
  );
}

/**
 * Get status color for calendar display
 */
export function getLeaveStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  const normalizedStatus = status.toUpperCase();

  switch (normalizedStatus) {
    case "APPROVED":
      return {
        bg: "bg-green-100 dark:bg-green-950",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-300 dark:border-green-700",
        label: "Approved",
      };
    case "PENDING":
    case "APPROVED_BY_MANAGER":
      return {
        bg: "bg-yellow-100 dark:bg-yellow-950",
        text: "text-yellow-700 dark:text-yellow-300",
        border: "border-yellow-300 dark:border-yellow-700",
        label: "Pending",
      };
    case "REJECTED":
    case "CANCELLED":
      return {
        bg: "bg-red-100 dark:bg-red-950",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-300 dark:border-red-700",
        label: "Rejected",
      };
    case "PROCESSING":
      return {
        bg: "bg-blue-100 dark:bg-blue-950",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-300 dark:border-blue-700",
        label: "Processing",
      };
    default:
      return {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-300 dark:border-gray-700",
        label: status,
      };
  }
}

import { formatInDhakaTimezone, APP_TIMEZONE } from "../utils";

/**
 * Get weekday names
 */
export function getWeekdayNames(fmt: "short" | "long" = "short"): string[] {
  const baseDate = new Date(2024, 0, 7); // A Sunday
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    days.push(
      fmt === "short"
        ? formatInDhakaTimezone(date, { weekday: "short" })
        : formatInDhakaTimezone(date, { weekday: "long" })
    );
  }

  return days;
}
