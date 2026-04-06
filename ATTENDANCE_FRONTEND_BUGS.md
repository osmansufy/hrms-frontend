# Employee Dashboard — Attendance Frontend Bug Report

> **Reviewed:** 2026-04-06
> **Files reviewed:**
> - `src/app/dashboard/employee/page.tsx`
> - `src/app/dashboard/employee/attendance/page.tsx`
> - `src/app/dashboard/employee/attendance/components/*`
> - `src/app/dashboard/employee/attendance/reconciliation/page.tsx`
> - `src/lib/api/attendance.ts`
> - `src/lib/queries/attendance.ts`
> - `src/lib/utils.ts`
> - `src/app/dashboard/employee/utils/attendance-handlers.ts`

---

## Bug 1 — `timezone` not sent on sign-in (P1 · Critical)

**File:** `src/lib/api/attendance.ts` → `signIn()` / `signOut()`
**Also:** `src/app/dashboard/employee/utils/attendance-handlers.ts` → `buildAttendancePayload()`

### Problem

The backend `SignInDto` has an optional **`timezone`** field (IANA name, e.g. `"Asia/Dhaka"`). The backend uses it to:
- Normalize the "local calendar day" for duplicate detection
- Store the timezone on the attendance row (used by auto-close, late detection, reconciliation)

The frontend **never sends `timezone`**. Both the API function type and the payload builder omit it entirely.

```ts
// Current — no timezone
export async function signIn(payload: {
  location?: string | null;
  latitude?: number;
  ...
}) { ... }

// What buildAttendancePayload returns — no timezone
export async function buildAttendancePayload(...): Promise<AttendancePayload> {
  ...
  // timezone never included
}
```

### Impact
- Users outside `Asia/Dhaka` get wrong "calendar day" assigned (e.g. a late-night sign-in lands on the wrong date)
- Late detection uses wrong offset (falls back to server default)
- Auto-close cron picks wrong sign-out time

### Fix
1. Add `timezone?: string` to `AttendancePayload` type and `signIn()` / `signOut()` payload types in `lib/api/attendance.ts`
2. In `buildAttendancePayload()`, add `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone`
3. Pass through in `AttendanceCard` or dashboard sign-in handler via `useTimezone()` context

---

## Bug 2 — Dashboard 7-day chart uses plain `YYYY-MM-DD` instead of timezone-aware ISO datetimes (P2 · High)

**File:** `src/app/dashboard/employee/page.tsx` lines 90–101

### Problem

The chart query params use **`toLocalDateStr`** (returns `YYYY-MM-DD`) directly as `startDate` / `endDate`:

```ts
chartQueryParams: {
  startDate: toLocalDateStr(start),  // "2026-03-30" — plain date string
  endDate: toLocalDateStr(end),      // "2026-04-06"
  limit: "7",
},
```

The backend does `new Date("2026-03-30")` which parses as **UTC midnight**, not business-timezone midnight. `attendance.date` rows are stored as **Dhaka-aligned** UTC instants. The windows don't match.

By contrast, `ComprehensiveHistoryTab` correctly uses:
```ts
startDate: toStartOfDayISO(dateRange.startDate),  // "2026-03-29T18:00:00.000Z"
endDate: toEndOfDayISO(dateRange.endDate),
```

### Impact
- Chart bars near month/day boundaries may miss records or include the wrong day's records
- Inconsistent with the rest of the attendance history views

### Fix
Replace `toLocalDateStr()` with `toStartOfDayISO()` / `toEndOfDayISO()` for `startDate` and `endDate`.

---

## Bug 3 — Chart 7-day loop mixes local and UTC date arithmetic (P2 · High)

**File:** `src/app/dashboard/employee/page.tsx` lines 90–121

### Problem

`start` is computed with **local** `.setDate()`:
```ts
start.setDate(end.getDate() - 6);   // local calendar
```

But the loop increments with **UTC**:
```ts
d.setUTCDate(start.getUTCDate() + i);  // UTC calendar
```

Then the record matching compares **UTC** year/month/day:
```ts
recDate.getUTCFullYear() === d.getUTCFullYear() &&
recDate.getUTCMonth() === d.getUTCMonth() &&
recDate.getUTCDate() === d.getUTCDate()
```

For an Asia/Dhaka user, `attendance.date` is stored as `YYYY-MM-DDT18:00:00Z` (local midnight - 6h). Comparing on UTC date directly will mismatch.

### Impact
- Chart shows wrong bars for the wrong days
- Possible off-by-one errors for records near midnight in local time

### Fix
Build the 7-day range as an array of `YYYY-MM-DD` local strings (using `toLocalDateStr`), then match records by comparing both dates in the same timezone (e.g. convert `record.date` to local date string using `toLocalDateStr(new Date(record.date))`).

---

## Bug 4 — `useMemo([], [])` locks month windows — stale after midnight (P3 · Medium)

**Files:**
- `src/app/dashboard/employee/page.tsx` lines 90–101 (chart)
- `src/app/dashboard/employee/attendance/components/stats-card.tsx` lines 14–22

### Problem

Both use `useMemo(..., [])` — dependencies are frozen on mount. If a user keeps the tab open across midnight into a new day or month, the queries still use the **old month/day window**. They see last month's data labelled "this month."

```ts
// stats-card.tsx — frozen on mount
const queryParams = useMemo(() => ({
    startDate: toStartOfDayISO(toLocalDateStr(startOfMonth)),
    endDate: toEndOfDayISO(toLocalDateStr(endOfMonth)),
    limit: "100",
}), []);  // ← empty deps
```

### Impact
- Stats card shows wrong month's data after midnight rollover
- Chart shows stale last-7-days window

### Fix
Compute a stable "today" tick (e.g. `useMemo(() => new Date(), [])` is fine for initial render, but re-evaluate at midnight). Simplest: add current date as a stable key so React refetches when day changes. Consider a small `useTodayDate()` hook that updates at midnight.

---

## Bug 5 — `AttendanceStatsCard` approximates working days (P3 · Medium)

**File:** `src/app/dashboard/employee/attendance/components/stats-card.tsx` lines 34–37

### Problem

```ts
const workingDays = Math.floor(totalDays * 5 / 7); // Approximate
const percentage = workingDays > 0 ? Math.round((records.length / workingDays) * 100) : 0;
```

The backend computes working days accurately via schedule-aware `getWorkingDaysInMonth()`. This 5/7 approximation ignores holidays, custom work schedules, and month-length variation.

### Impact
- Attendance percentage on the stats card is inaccurate
- Employees with non-standard schedules see wrong numbers

### Fix
Use `useMyMonthlyAttendanceSummary()` (already used in `EmployeeSummaryCard`) which returns `totalWorkingDays`, `totalPresentDays`, etc. from the server. Derive stats from those fields instead.

---

## Bug 6 — Reconciliation `userId` is actually `email`; `max` date uses UTC (P3 · Medium)

**File:** `src/app/dashboard/employee/attendance/reconciliation/page.tsx` lines 36–37, 132–133

### Problem A — Wrong variable name:
```ts
const userId = session?.user?.email;  // This is the EMAIL, not userId
```
The variable is only used for `enabled` checks and `queryKey`. It never hits the API as a `userId`, but naming it `userId` is misleading and could cause bugs if used as one.

### Problem B — `max` date uses UTC:
```tsx
max={new Date().toISOString().split('T')[0]}
```
`toISOString()` always returns UTC. For `Asia/Dhaka` users from 00:00–05:59 **local time**, this is still the *previous* UTC date, so "today" is blocked as a future date.

### Impact
- A → confusing code, future bug if `userId` is accidentally passed to an API call
- B → employees cannot submit a reconciliation for "today" in the early morning hours (00:00–05:59 Dhaka time)

### Fix A
Rename `userId → userEmail` (or use `session?.user.id` for the query key).

### Fix B
```tsx
max={toLocalDateStr(new Date())}
```

---

## Bug 7 — Cache not invalidated after sign-out for history views (P4 · Low)

**File:** `src/lib/queries/attendance.ts` → `useSignOut`

### Problem

```ts
export function useSignOut(userId?: string) {
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today(userId) });
      // Missing: my-records, my-monthly-summary, chart data
    },
  });
}
```

After sign-out, the attendance history list and monthly summary can remain stale until the stale-time expires.

### Fix
Invalidate related queries on sign-out success:
```ts
queryClient.invalidateQueries({ queryKey: ["attendance", "my-records", userId] });
queryClient.invalidateQueries({ queryKey: ["attendance", "my-monthly-summary"] });
```

---

## Bug 8 — `getMyBreaks` sends local `today` string without timezone alignment (P4 · Low)

**File:** `src/app/dashboard/employee/page.tsx` lines 241–252

### Problem

```ts
const today = useMemo(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}, []);
const { data: todayBreaksData } = useMyBreaks({
    startDate: today,
    endDate: today,
});
```

The break service queries `break.date` using `normalizeToLocalDay()`. Sending `YYYY-MM-DD` works here only because the backend calls `normalizeToLocalDay(new Date(query.date))` — but `new Date("2026-04-06")` is **UTC midnight**, not Dhaka midnight. This means the query windows are UTC-calendar-aligned, not business-calendar-aligned.

### Impact
Minor — breaks from "today" in Dhaka (00:00–05:59 local) may not appear if the UTC date is still the previous day.

### Fix
Use `toStartOfDayISO` / `toEndOfDayISO` for break queries to match how the backend normalizes dates.

---

## Summary Table

| # | Priority | File | Problem |
|---|----------|------|---------|
| 1 | **P1 Critical** | `lib/api/attendance.ts`, `utils/attendance-handlers.ts` | `timezone` never sent on sign-in/out |
| 2 | **P2 High** | `employee/page.tsx` | Chart uses plain `YYYY-MM-DD` instead of ISO datetime range |
| 3 | **P2 High** | `employee/page.tsx` | Chart loop mixes local and UTC date arithmetic |
| 4 | **P3 Medium** | `employee/page.tsx`, `stats-card.tsx` | `useMemo([], [])` freezes date windows — stale after midnight |
| 5 | **P3 Medium** | `attendance/components/stats-card.tsx` | 5/7 approximation for working days |
| 6 | **P3 Medium** | `reconciliation/page.tsx` | `userId` is actually `email`; `max` date uses UTC |
| 7 | **P4 Low** | `lib/queries/attendance.ts` | Sign-out doesn't invalidate history/summary queries |
| 8 | **P4 Low** | `employee/page.tsx` | `getMyBreaks` sends local string, not ISO-aligned range |
