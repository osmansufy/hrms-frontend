# Employee Dashboard — Attendance Frontend Fix Progress

> **Started:** 2026-04-06
> **Bug report:** [ATTENDANCE_FRONTEND_BUGS.md](./ATTENDANCE_FRONTEND_BUGS.md)

---

## Status Legend


| Symbol | Meaning           |
| ------ | ----------------- |
| ⬜      | Pending           |
| 🔄     | In progress       |
| ✅      | Done              |
| ❌      | Blocked / skipped |


---

## Phase 1 — Critical: Send timezone on sign-in / sign-out

**Goal:** Ensure every sign-in and sign-out call includes the browser's IANA timezone so the backend can normalize calendar days correctly.


| #   | Task                                                                                               | File(s)                                                   | Status |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| 1.1 | Add `timezone?: string` to `AttendancePayload` type                                                | `src/lib/api/attendance.ts`                               | ⬜      |
| 1.2 | Add `timezone?: string` to `signIn()` / `signOut()` param types                                    | `src/lib/api/attendance.ts`                               | ⬜      |
| 1.3 | Include `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone` in `buildAttendancePayload()` | `src/app/dashboard/employee/utils/attendance-handlers.ts` | ⬜      |
| 1.4 | Verify `AttendanceCard` / sign-in handler passes the timezone through                              | `src/app/dashboard/employee/page.tsx` or `AttendanceCard` | ⬜      |


**Bug ref:** [Bug 1](./ATTENDANCE_FRONTEND_BUGS.md#bug-1--timezone-not-sent-on-sign-in-p1--critical)

---

## Phase 2 — High: Fix 7-day chart date range & loop logic

**Goal:** Replace the mixed local/UTC date arithmetic in the dashboard chart with a consistent, timezone-aware approach.


| #   | Task                                                                                               | File(s)                               | Status |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------- | ------ |
| 2.1 | Replace `toLocalDateStr(start/end)` with `toStartOfDayISO` / `toEndOfDayISO` in `chartQueryParams` | `src/app/dashboard/employee/page.tsx` | ⬜      |
| 2.2 | Rewrite the 7-day loop: build array of local `YYYY-MM-DD` strings with `toLocalDateStr`            | `src/app/dashboard/employee/page.tsx` | ⬜      |
| 2.3 | Fix record matching: compare `toLocalDateStr(new Date(record.date))` to loop date string           | `src/app/dashboard/employee/page.tsx` | ⬜      |


**Bug refs:** [Bug 2](./ATTENDANCE_FRONTEND_BUGS.md#bug-2--dashboard-7-day-chart-uses-plain-yyyy-mm-dd-instead-of-timezone-aware-iso-datetimes-p2--high), [Bug 3](./ATTENDANCE_FRONTEND_BUGS.md#bug-3--chart-7-day-loop-mixes-local-and-utc-date-arithmetic-p2--high)

---

## Phase 3 — Medium: Fix reconciliation page

**Goal:** Rename `userId → userEmail` for clarity and fix the `max` date attribute to use local calendar date.


| #   | Task                                                                                                  | File(s)                                                         | Status |
| --- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| 3.1 | Rename `userId` → `userEmail` (or use real `session?.user?.id`)                                       | `src/app/dashboard/employee/attendance/reconciliation/page.tsx` | ⬜      |
| 3.2 | Replace `new Date().toISOString().split('T')[0]` with `toLocalDateStr(new Date())` for the `max` prop | `src/app/dashboard/employee/attendance/reconciliation/page.tsx` | ⬜      |


**Bug ref:** [Bug 6](./ATTENDANCE_FRONTEND_BUGS.md#bug-6--reconciliation-userid-is-actually-email-max-date-uses-utc-p3--medium)

---

## Phase 4 — Medium: Freeze-safe date windows

**Goal:** Stop `useMemo([], [])` from locking stale date windows if the user keeps the tab open past midnight.


| #   | Task                                                                                | File(s)                                                           | Status |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------ |
| 4.1 | Create `useTodayDate()` hook that returns current date and refreshes at midnight    | `src/hooks/use-today-date.ts`                                     | ⬜      |
| 4.2 | Replace frozen `useMemo([], [])` in dashboard chart range with `useTodayDate()` dep | `src/app/dashboard/employee/page.tsx`                             | ⬜      |
| 4.3 | Replace frozen `useMemo([], [])` in `AttendanceStatsCard` with `useTodayDate()` dep | `src/app/dashboard/employee/attendance/components/stats-card.tsx` | ⬜      |


**Bug ref:** [Bug 4](./ATTENDANCE_FRONTEND_BUGS.md#bug-4--usememo-locks-month-windows--stale-after-midnight-p3--medium)

---

## Phase 5 — Medium: Replace 5/7 working-days approximation

**Goal:** Use server-provided working day count instead of the `Math.floor(totalDays * 5/7)` hack.


| #   | Task                                                                                                                 | File(s)                                                           | Status |
| --- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------ |
| 5.1 | Use `useMyMonthlyAttendanceSummary()` data (fields: `totalWorkingDays`, `totalPresentDays`) in `AttendanceStatsCard` | `src/app/dashboard/employee/attendance/components/stats-card.tsx` | ⬜      |
| 5.2 | Remove the `Math.floor(totalDays * 5 / 7)` approximation                                                             | `src/app/dashboard/employee/attendance/components/stats-card.tsx` | ⬜      |


**Bug ref:** [Bug 5](./ATTENDANCE_FRONTEND_BUGS.md#bug-5--attendancestatscard-approximates-working-days-p3--medium)

---

## Phase 6 — Low: Query invalidation & break date alignment

**Goal:** Ensure caches are fully invalidated after sign-out and that break queries use ISO-aligned date ranges.


| #   | Task                                                                                         | File(s)                               | Status |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------- | ------ |
| 6.1 | Add `my-records` and `my-monthly-summary` query invalidation in `useSignOut.onSuccess`       | `src/lib/queries/attendance.ts`       | ⬜      |
| 6.2 | Replace manual `today` string in `useMyBreaks` call with `toStartOfDayISO` / `toEndOfDayISO` | `src/app/dashboard/employee/page.tsx` | ⬜      |


**Bug refs:** [Bug 7](./ATTENDANCE_FRONTEND_BUGS.md#bug-7--cache-not-invalidated-after-sign-out-for-history-views-p4--low), [Bug 8](./ATTENDANCE_FRONTEND_BUGS.md#bug-8--getmybreaks-sends-local-today-string-without-timezone-alignment-p4--low)

---

## Phase 7 — Validation


| #   | Task                                                                       | Status |
| --- | -------------------------------------------------------------------------- | ------ |
| 7.1 | Run `pnpm lint` in `frontend/` — zero new errors                           | ⬜      |
| 7.2 | Run `pnpm test` in `frontend/` — no regressions                            | ⬜      |
| 7.3 | Manual smoke test: sign in, sign out, check chart, submit reconciliation   | ⬜      |
| 7.4 | Test with browser in `Asia/Dhaka` timezone (DevTools → Sensors → Location) | ⬜      |


---

## Overall Progress


| Phase | Description                          | Status |
| ----- | ------------------------------------ | ------ |
| 1     | Send timezone on sign-in/sign-out    | ⬜      |
| 2     | Fix 7-day chart date range & loop    | ⬜      |
| 3     | Fix reconciliation max date & userId | ⬜      |
| 4     | Freeze-safe date windows             | ⬜      |
| 5     | Replace 5/7 working-days hack        | ⬜      |
| 6     | Query invalidation & break dates     | ⬜      |
| 7     | Validation                           | ⬜      |


---

## Change Log


| Date       | Phase | Change                                           |
| ---------- | ----- | ------------------------------------------------ |
| 2026-04-06 | —     | Bug report created, progress tracker initialized |


