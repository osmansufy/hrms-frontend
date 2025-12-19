# Attendance Module - Frontend Implementation

## Overview

The Attendance module provides time tracking and presence management for both employees and admins:

- **Employee Interface**: Clock in/out, view today's status, location tracking
- **Admin Interface**: Monitor all users' attendance, manually adjust records, manage adjustment requests

## Files & Structure

### API Client
- **[src/lib/api/attendance.ts](src/lib/api/attendance.ts)** - REST client for attendance endpoints
  - Types: `AttendanceRecord`, `AttendanceListParams`, `AttendanceAdjustment`
  - Functions: `signIn()`, `signOut()`, `getTodayAttendance()`, `getAttendanceHistory()`, `manuallyAdjustAttendance()`, etc.

### React Query Hooks
- **[src/lib/queries/attendance.ts](src/lib/queries/attendance.ts)** - TanStack React Query hooks
  - Employee: `useTodayAttendance()`, `useSignIn()`, `useSignOut()`
  - Admin: `useAttendanceHistory()`, `useAttendanceList()`, `useManuallyAdjustAttendance()`, `useAttendanceAdjustments()`, `useApproveAttendanceAdjustment()`, `useRejectAttendanceAdjustment()`

### Pages
- **[src/app/dashboard/employee/attendance/page.tsx](src/app/dashboard/employee/attendance/page.tsx)** - Employee clock in/out page
- **[src/app/dashboard/admin/attendance/page.tsx](src/app/dashboard/admin/attendance/page.tsx)** - Admin overview dashboard with today's attendance and adjustments tab

### Components
- **[src/app/dashboard/admin/attendance/components/manual-adjust-dialog.tsx](src/app/dashboard/admin/attendance/components/manual-adjust-dialog.tsx)** - Dialog to manually update attendance times
- **[src/app/dashboard/admin/attendance/components/adjustments-tab.tsx](src/app/dashboard/admin/attendance/components/adjustments-tab.tsx)** - List of pending/approved/rejected adjustments with approve/reject actions

### Navigation
- Updated [src/modules/shared/config/navigation.ts](src/modules/shared/config/navigation.ts) to add `/dashboard/admin/attendance` route

## Backend API Contract

The frontend assumes the following backend endpoints (not yet implemented in backend, but contracted here):

### Employee Endpoints
```
POST /attendance/sign-in
  Body: { location?: string }
  Response: AttendanceRecord

POST /attendance/sign-out
  Body: { location?: string }
  Response: AttendanceRecord

GET /attendance/:userId/today
  Response: AttendanceRecord
```

### Admin Endpoints (Placeholder contracts for Phase 2)
```
GET /attendance/admin/list
  Params: { userId?, startDate?, endDate?, isLate?, page?, limit?, sortBy?, sortOrder? }
  Response: { data: AttendanceRecord[], total, page, limit }

GET /attendance/admin/history
  Params: (same as list)
  Response: AttendanceRecord[]

GET /attendance/admin/employee/:userId
  Params: { startDate?, endDate? }
  Response: AttendanceRecord[]

POST /attendance/:attendanceId/adjust
  Body: { signIn?: string | null, signOut?: string | null, reason: string }
  Response: AttendanceAdjustment

GET /attendance/admin/adjustments
  Params: { userId? }
  Response: AttendanceAdjustment[]

PATCH /attendance/adjustments/:adjustmentId/approve
  Body: { notes?: string }
  Response: AttendanceAdjustment

PATCH /attendance/adjustments/:adjustmentId/reject
  Body: { reason: string }
  Response: AttendanceAdjustment

GET /attendance/admin/export
  Params: { startDate, endDate, format?: 'csv' | 'xlsx', userId? }
  Response: Blob (file download)
```

## Usage Examples

### Employee Sign In/Out
```typescript
import { useSignIn, useSignOut, useTodayAttendance } from "@/lib/queries/attendance";

export function ClockWidget({ userId }) {
  const { data: today } = useTodayAttendance(userId);
  const signInMutation = useSignIn(userId);
  const signOutMutation = useSignOut(userId);

  const handleSignIn = async () => {
    await signInMutation.mutateAsync({ location: "Office" });
  };

  return (
    <div>
      <p>Status: {today?.signOut ? "Signed out" : "Signed in"}</p>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}
```

### Admin Manual Adjust
```typescript
import { ManualAdjustDialog } from "@/app/dashboard/admin/attendance/components/manual-adjust-dialog";

export function AttendanceRow({ attendanceId, signIn, signOut }) {
  return (
    <div>
      <ManualAdjustDialog
        attendanceId={attendanceId}
        currentSignIn={signIn}
        currentSignOut={signOut}
        onSuccess={() => console.log("Adjusted")}
      />
    </div>
  );
}
```

## Auth & Permissions

- **Employees** can only view/adjust their own attendance (`attendance.view` permission)
- **Admins** can view all employees' attendance and manually adjust records (implied `attendance.approve` or similar)
- Role-based access enforced in [src/lib/auth/permissions.ts](src/lib/auth/permissions.ts)

## Integration Checklist

- [x] Backend simple endpoints (sign in/out, get today) working
- [ ] Backend admin endpoints (list, adjust, approve/reject) implemented
- [ ] Admin page fully wired to backend list endpoint
- [ ] Manual adjust POST endpoint tested
- [ ] Adjustments approval workflow tested
- [ ] CSV export endpoint tested
- [ ] Employee history/calendar view added (Phase 2)
- [ ] Real-time WebSocket updates for admin dashboard (Phase 3)

## Phase 2 TODOs

1. **Employee History**: Add paginated history table under `/dashboard/employee/attendance/history`
2. **Admin Detail View**: Add employee detail page with full attendance calendar
3. **Bulk Actions**: Bulk approve/reject adjustments in admin dashboard
4. **Filters**: Add date range, status, late filter to admin list
5. **Notifications**: Toast/email on pending adjustments

## Phase 3 TODOs

1. **WebSocket Updates**: Real-time attendance status in admin dashboard
2. **Overtime Tracking**: Add overtime calculation and tracking
3. **Work Schedules**: Integrate shift/schedule-based late determination
4. **Audit Trail**: Log all manual adjustments with approver metadata
5. **Reports & Analytics**: Export, charts, attendance trends

## Notes

- All times are stored server-side and compared to `WORK_START_TIME` env for late determination
- Location is optional for tracking remote work vs. office vs. on-site
- Manual adjustments are not auto-approved; they require admin review (workflow TBD in Phase 2)
- Timezone support via `timezone` field on `AttendanceRecord` (currently UTC default in backend)
