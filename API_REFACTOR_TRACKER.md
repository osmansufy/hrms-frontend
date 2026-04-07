# Frontend API Refactor Tracker

This file tracks the migration from legacy mixed-role backend routes to the new role-scoped controllers:

- Employee scope: `*/my/*`
- Admin scope: `*/admin/*`
- Manager scope: `*/manager/*`

Backend source of truth: `backend/API_REFACTOR.md`.

---

## Completed

### Shared API clients (`frontend/src/lib/api/*`)

- **`leave.ts`**
  - Employee routes updated:
    - `POST /leave/my/upload-document`
    - `GET /leave/my/document/:leaveId`
    - `GET /leave/my/types`
    - `POST /leave/my/apply`
    - `GET /leave/my/history`
    - `GET /leave/my/policy/:leaveTypeId`
    - `GET /leave/my/balance`
    - `GET /leave/my/balance/:leaveTypeId`
    - `GET /leave/my/ledger/:leaveTypeId`
    - `GET /leave/my/:id`
    - Amendments (employee):
      - `POST /leave/my/amendment`
      - `GET /leave/my/amendments`
      - `GET /leave/my/amendment/:id`
  - Admin routes updated:
    - `GET /leave/admin/all`
    - `PATCH /leave/admin/:id/override`
    - `POST /leave/admin/policy`
    - `PUT /leave/admin/policy/:leaveTypeId`
    - Notice rules:
      - `GET /leave/admin/notice-rules`
      - `PUT /leave/admin/notice-rule/:id`
      - `DELETE /leave/admin/notice-rule/:id`
      - `POST /leave/admin/policy/:leavePolicyId/notice-rule`
    - Accrual rules:
      - `POST /leave/admin/accrual-rule`
      - `GET /leave/admin/accrual-rules`
      - `GET /leave/admin/accrual-rule/:id`
      - `PUT /leave/admin/accrual-rule/:id`
      - `POST /leave/admin/accrual/process/:userId/:leaveTypeId`
    - Balance admin:
      - `POST /leave/admin/balance/adjust`
      - `POST /leave/admin/balance/initialize`
      - `GET /leave/admin/balance/all`
  - Manager routes updated:
    - `PATCH /leave/manager/:id/approve`
    - `PATCH /leave/manager/:id/reject`
    - `PATCH /leave/manager/amendment/:id/approve`
    - `PATCH /leave/manager/amendment/:id/reject`
    - `GET /leave/manager/subordinate/:subordinateUserId/balance`

- **`asset.ts`**
  - Employee routes updated:
    - `GET /assets/my`
    - `POST /assets/my/requests`
    - `GET /assets/my/requests`
  - Admin routes updated:
    - Assets CRUD: `GET/POST /assets/admin`, `GET/PATCH /assets/admin/:id`
    - Assign/return: `POST /assets/admin/:id/assign`, `POST /assets/admin/:id/return`
    - Assignments: `GET /assets/admin/assignments`
    - Offboarding: `POST /assets/admin/offboarding/return-all`
    - Types: `GET/POST /assets/admin/types`, `GET/PATCH /assets/admin/types/:id`
    - Requests:
      - `GET /assets/admin/requests`
      - `GET /assets/admin/requests/processing`
      - `GET /assets/admin/requests/:id`
      - `PATCH /assets/admin/requests/:id/approve`
      - `PATCH /assets/admin/requests/:id/reject`
      - `POST /assets/admin/requests/:id/fulfill`
  - Manager routes updated:
    - `GET /assets/manager/requests/pending`

- **`employees.ts`**
  - Admin routes updated:
    - `GET /employees/admin`
    - `GET /employees/admin/:id`
    - `POST /employees/admin`
    - `POST /employees/admin/bulk`
    - `PATCH /employees/admin/:id`
    - `PATCH /employees/admin/:id/personal-info`
    - `DELETE /employees/admin/:id`
    - `GET /employees/admin/search`
    - `PATCH /employees/admin/:id/manager`
    - `GET /employees/admin/:id/subordinates`
  - Profile picture (admin):
    - `POST /employees/admin/:id/profile-picture`
    - `GET /employees/admin/:id/profile-picture-url`
    - `DELETE /employees/admin/:id/profile-picture`

- **`attendance.ts`**
  - Employee routes updated:
    - `GET /attendance/my/today`
    - `POST /attendance/my/sign-in`
    - `POST /attendance/my/sign-out`
    - `GET /attendance/my/records`
    - `GET /attendance/my/lost-hours`
    - `GET /attendance/my/monthly-late-count`
    - Breaks:
      - `POST /attendance/my/breaks/start`
      - `PATCH /attendance/my/breaks/:id/end`
      - `GET /attendance/my/breaks/active`
      - `GET /attendance/my/breaks`
  - Admin routes updated:
    - Breaks:
      - `GET /attendance/admin/breaks`
      - `GET /attendance/admin/breaks/:id`
      - `POST /attendance/admin/breaks`
      - `PATCH /attendance/admin/breaks/:id`
      - `DELETE /attendance/admin/breaks/:id`
      - `GET /attendance/admin/breaks/employee/:id`
      - `GET /attendance/admin/breaks/attendance/:id`
    - Reconciliation:
      - `GET /attendance/admin/reconciliation-requests`
      - `PUT /attendance/admin/reconciliation-requests/:id/status`
  - Manager routes updated:
    - `GET /attendance/manager/subordinate/:id/history`

### Admin dashboard pages (direct calls)

- **`frontend/src/app/dashboard/admin/communications/page.tsx`**
  - Updated employee lookup: `GET /employees/admin`
- **`frontend/src/app/dashboard/admin/employees/[id]/assign-leave/page.tsx`**
  - Updated initialize balance: `POST /leave/admin/balance/initialize`
- **`frontend/src/app/dashboard/admin/employees/bulk/page.tsx`**
  - Updated bulk upload: `POST /employees/admin/bulk`

---

## Still to verify (spot-check in UI)

- Admin leave approvals flow:
  - Confirm admin dashboard uses admin endpoints (not manager endpoints):
    - `PATCH /leave/admin/:id/approve`
    - `PATCH /leave/admin/:id/reject`
    - `PATCH /leave/admin/:id/override`
- Employee profile picture admin-view endpoints:
  - Confirm admin UI uses the admin-scoped profile picture routes and that permissions/guards behave as expected.

## Latest fixes (2026-04-07)

- Backend: fixed route shadowing for `/employees/admin` by registering legacy `EmployeeController` last in `backend/src/employee/employee.module.ts`.
- Frontend: updated employee attendance reconciliation page to new employee-scoped endpoints:
  - `GET /attendance/my/reconciliation`
  - `POST /attendance/my/reconciliation`
- Frontend: updated `employees.ts` profile picture calls to `/employees/admin/:id/*`.
- Frontend: removed legacy leave policy endpoint usage by building employee policy view from `GET /leave/my/types`.
- Frontend: removed legacy leave bulk approve/reject usage in manager pending approvals (bulk now executes per-id against manager approve/reject endpoints).
- Frontend: replaced legacy "get user leave balance by userId+type" helper usage in queries with `/admin/leave-balances/user/:userId` + client-side filter.
- Frontend: manager team list now uses `GET /employees/manager/my-team` via `getMyTeam()` + `useManagerSubordinates()`.
- Backend: added HR final approval endpoints:
  - `PATCH /leave/admin/:id/approve`
  - `PATCH /leave/admin/:id/reject`

## Deprecated frontend helpers (need call-site cleanup)

These functions in `frontend/src/lib/api/leave.ts` map to legacy backend routes that no longer exist after the refactor:

- `getMyLeavePolicies()`
- `bulkApproveLeaves()`
- `bulkRejectLeaves()`
- `getUserLeaveBalance()`

Next step: update any call sites still using them to the new endpoints.

