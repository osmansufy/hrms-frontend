# Frontend Attendance Feature - Quick Start Guide

## For Developers

### 1. Employee Features

**User Scenario:** Employee signs in at 9 AM and out at 6 PM

**Page:** `/dashboard/employee/attendance`

```tsx
// Component automatically:
// 1. Loads today's attendance via useTodayAttendance(userId)
// 2. Shows current sign-in/out status
// 3. Displays location input (optional)
// 4. Shows late indicator if signed in after 9:30 AM

// Actions:
// - Click "Sign in" → calls useSignIn() → updates today status
// - Click "Sign out" → calls useSignOut() → finalizes daily record
```

**What's Needed from Backend:**
- `POST /attendance/sign-in` - Create today's attendance record with timestamp
- `POST /attendance/sign-out` - Update today's record with sign-out time
- `GET /attendance/:userId/today` - Fetch today's attendance data

✅ **Status:** Already implemented in backend

---

### 2. Admin Dashboard

**User Scenario:** HR admin views all employees' attendance, manually adjusts times for remote worker

**Page:** `/dashboard/admin/attendance`

**Tab 1: Today's Attendance**
- Table showing all users
- Status badge (Signed in / Signed out / Not signed in)
- Times and locations
- "Adjust" button per row → opens manual adjust dialog
- "View" button → links to employee detail page

**Tab 2: Adjustments**
- List of pending adjustment requests
- Inline "Approve" and "Reject" buttons
- Shows reason for adjustment
- Auto-invalidates/refetches when approved/rejected

**Action: Manual Adjustment**
```
HR clicks "Adjust" button on John's row
→ Dialog opens with current times (09:15, 18:00)
→ HR edits: 09:00 (remote work started earlier)
→ HR enters reason: "Remote work, was in meetings"
→ HR clicks "Adjust"
→ POST /attendance/{attendanceId}/adjust
→ Adjustment saved to DB
→ Tab 2 shows new adjustment request pending approval
```

**What's Needed from Backend:**
- `GET /attendance/admin/list` - Paginated list of all employees' today attendance
- `POST /attendance/:attendanceId/adjust` - Create manual adjustment record
- `GET /attendance/admin/adjustments` - List pending/approved/rejected adjustments
- `PATCH /attendance/adjustments/:id/approve` - Approve adjustment request
- `PATCH /attendance/adjustments/:id/reject` - Reject adjustment request
- `GET /attendance/admin/export` - Export CSV of month's attendance

❌ **Status:** Not yet implemented (Phase 2)

---

## For Testing

### Quick Test Script (Browser Console)

```javascript
// Employee: Get today's attendance
const userId = sessionStorage.getItem('userId'); // or from session
const response = await fetch(`/attendance/${userId}/today`, {
  headers: { Authorization: `Bearer ${token}` }
});
console.log(await response.json()); // Should show signIn, signOut, isLate

// Employee: Sign in
const signInResponse = await fetch('/attendance/sign-in', {
  method: 'POST',
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ location: 'Office' })
});
console.log(await signInResponse.json()); // Should show new record

// Admin: List all today's attendance (when implemented)
const adminResponse = await fetch('/attendance/admin/list', {
  headers: { Authorization: `Bearer ${adminToken}` }
});
console.log(await adminResponse.json()); // Should show { data: [...], total, page, limit }
```

---

## Frontend Architecture

```
Frontend (Next.js 16 + React 19)
├─ Employee Pages
│  └─ /dashboard/employee/attendance
│     └─ useTodayAttendance() ← GET /attendance/:userId/today
│     └─ useSignIn() ← POST /attendance/sign-in
│     └─ useSignOut() ← POST /attendance/sign-out
│
├─ Admin Pages
│  └─ /dashboard/admin/attendance
│     ├─ Today's Tab
│     │  └─ useTodayAttendance() × N users
│     │  └─ ManualAdjustDialog
│     │     └─ useManuallyAdjustAttendance() ← POST /attendance/:id/adjust
│     │
│     └─ Adjustments Tab
│        └─ useAttendanceAdjustments() ← GET /attendance/admin/adjustments
│        └─ useApproveAttendanceAdjustment() ← PATCH /attendance/adjustments/:id/approve
│        └─ useRejectAttendanceAdjustment() ← PATCH /attendance/adjustments/:id/reject
│
├─ API Client
│  └─ src/lib/api/attendance.ts
│     └─ Types + 8 functions (3 employee, 5 admin)
│
└─ React Query
   └─ src/lib/queries/attendance.ts
      └─ 13 hooks (useTodayAttendance, useSignIn, useSignOut, etc.)
```

---

## Implementation Timeline

### ✅ Phase 1 (Complete)
- Frontend types and API contracts
- Employee sign-in/out page (working)
- Admin dashboard scaffold
- Component library (ManualAdjustDialog, AttendanceAdjustmentsTab)
- Backend: 3 simple endpoints (sign-in, sign-out, get-today) ✅

### 🔄 Phase 2 (In Progress - Backend)
- Admin list/filter endpoints
- Manual adjust endpoint
- Adjustment approval workflow
- CSV export
- **Time estimate:** 3-4 days

### 📋 Phase 3 (Planned)
- Employee history/calendar
- Admin detail page per employee
- Bulk actions
- Real-time WebSocket updates
- Analytics/reports

---

## Notes for Backend Team

### Adjustment Workflow

The frontend assumes a **request-based approval system** (like LeaveApproval):

1. Admin adjusts attendance → Creates `AttendanceAdjustment` record with status PENDING
2. Adjustment appears in Adjustments tab
3. Admin (or HR manager) approves/rejects
4. Status updates to APPROVED/REJECTED

**Schema assumption:**
```prisma
model AttendanceAdjustment {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  date       DateTime
  signIn     DateTime?
  signOut    DateTime?
  reason     String
  status     String   @default("PENDING") // PENDING | APPROVED | REJECTED
  requestedBy String?
  approvedBy String?
  approvedAt DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Late Determination

Currently hard-coded in backend to 09:30 AM. Frontend displays `isLate` flag from attendance record. If work schedule changes, backend must recalculate.

### Timezone Support

Frontend passes `timezone` field but backend may ignore for now. Store times in UTC, display in user's TZ on frontend if needed.

---

## Common Issues & Fixes

**Problem:** Admin sees "Loading users..." forever  
**Solution:** Check `GET /users` endpoint - should return list of ApiUser[]

**Problem:** Manual adjust button disabled  
**Solution:** Backend endpoint `POST /attendance/:id/adjust` not implemented yet

**Problem:** Can't sign out - "No sign-in found"  
**Solution:** Sign in first, or backend not storing today's date correctly (timezone issue?)

**Problem:** Adjustments tab empty  
**Solution:** `GET /attendance/admin/adjustments` endpoint not implemented yet

---

## Files Reference

| File | Purpose | Status |
|------|---------|--------|
| [attendance.ts](src/lib/api/attendance.ts) | REST client | ✅ Done |
| [queries/attendance.ts](src/lib/queries/attendance.ts) | React Query hooks | ✅ Done |
| [admin/attendance/page.tsx](src/app/dashboard/admin/attendance/page.tsx) | Admin dashboard | ✅ Done |
| [admin/attendance/components/manual-adjust-dialog.tsx](src/app/dashboard/admin/attendance/components/manual-adjust-dialog.tsx) | Adjust form | ✅ Done |
| [admin/attendance/components/adjustments-tab.tsx](src/app/dashboard/admin/attendance/components/adjustments-tab.tsx) | Approvals UI | ✅ Done |
| [ATTENDANCE_MODULE_README.md](ATTENDANCE_MODULE_README.md) | Full docs | ✅ Done |
| [ATTENDANCE_IMPLEMENTATION_SUMMARY.md](ATTENDANCE_IMPLEMENTATION_SUMMARY.md) | What was built | ✅ Done |

---

**Next:** Implement backend admin endpoints to enable full workflow end-to-end testing.
