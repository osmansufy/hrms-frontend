# Frontend Roadmap (Super Admin / Admin / Employee)

## Context
- Aligns with existing backend API and role claims (`super-admin`, `admin`, `employee`).
- Goal: ship incremental, production-safe slices with clear data contracts and guarded navigation.

## Guiding Principles
- Server-first auth: protect routes via middleware and server loaders; mirror with client guards.
- Role-driven UI: nav, feature flags, and API scopes derived from token claims.
- Consistent data layer: typed API clients/hooks, standard pagination/filter/sort schemas, unified error shape.
- UX quality: skeleton/empty/error states, optimistic updates only when safe, confirmations for destructive actions.
- Observability: surface audit trails for privileged actions; log frontend errors with correlation IDs where provided by backend.

## Cross-Cutting Foundations (Phase 0)
- Auth wiring: ensure token parsing, role claims, and refresh/redirect flows are stable.
- Navigation: role-based config, guarded routes for `dashboard/super-admin`, `dashboard/admin`, `dashboard/employee`.
- UI kit & layout: app shell, table, card, form primitives, modal/drawer, toast/alert patterns.
- Data utilities: fetcher with retry/backoff, typed response parsing, and common query keys.
- Loading UX: skeleton components for cards/tables; empty-state templates; error boundaries per page.

## Dashboards by Role
### Super Admin (org/tenant control)
- Overview: org-wide KPIs (headcount, attrition, hiring pipeline, compliance status).
- Tenant & user administration: create/edit/deactivate tenants; assign admins/super-admins; role management UI.
- Audit & compliance: activity log with filters (actor/date/action); export/download.
- Billing/licensing: plan limits, usage meters, invoices/history.
- Global settings: security policies (password/2FA), feature flags, email/SMS templates.

### Admin (tenant-level operations)
- Overview: team stats (headcount by department, joins/leaves, pending approvals).
- People directory: searchable/filterable table, profile quick-view, CSV import, permitted bulk actions.
- Approvals: leave/expense/workflow approvals with bulk approve/deny and filtering.
- Scheduling/leave: calendar view, policy visibility, conflict warnings.
- Performance: cycles list, review statuses, reminders.
- Reports: saved reports, CSV/XLS export, scheduled email delivery.

### Employee (self-service)
- Overview: personal summary (leave balance, upcoming time off, pending tasks/approvals on them).
- Profile: view/update allowed fields; document uploads.
- Leave/requests: submit/apply, view history, cancel; attach documents and notes; show policy context and balance checks; track approval status.
- Expenses: submit, track status, resubmit with notes.
- Timesheet (if used): log hours, weekly summary.
- Attendance: clock-in/out with geolocation/device metadata if provided by backend; show daily/weekly summary, anomalies (late/early/absent), and correction requests with approval flow.
- Performance: view goals/reviews, acknowledge feedback.
- Notifications: in-app + email; read/unread state.

## Navigation & Authorization
- Derive nav from role capability map; hide ineligible routes client-side and block server-side.
- Middleware guards for each dashboard segment; redirect unauthenticated/unauthorized to sign-in/403.
- Capability matrix maps role → allowed resources/actions → API calls per page.

## Data Contracts & API Alignment
- Standardize list endpoints: pagination, sort, filter params; consistent empty/error shapes.
- Separate scopes: super-admin (org/tenant endpoints), admin (dept/team scoped), employee (self scoped).
- Destructive actions: require confirmation + audit note; backend audit IDs surfaced in UI where provided.
- File uploads (docs/receipts): use signed URLs if available; show progress/errors.

## Components & Hooks
- API clients/hooks per resource: auth/session, tenants, users, approvals, leave, expenses, performance, notifications.
- Shared UI: table with column config, form wrappers (schema validation), modal/drawer patterns, toast/sonner for feedback.
- Utilities: date/timezone helpers, money formatting, attachment helper, role guard HOCs/hooks.

## Testing & Quality
- Unit: utils/hooks; contract tests for API clients (mocks matching backend schema).
- Integration: critical flows per role (login → dashboard render → key action succeeds).
- E2E smoke: one happy-path per role in CI; cover navigation guards and basic CRUD.
- Accessibility: keyboard nav, focus management for modals/drawers, form semantics.

## Milestones (Incremental Delivery)
1) Foundations: auth/guards, role-based nav, shared UI primitives, data fetcher.
2) Employee MVP: overview, profile edit, leave/expense submit, notifications surface.
3) Admin slice: directory, approvals, scheduling/leave views, exports.
4) Super-admin slice: tenant/user admin, audit log, billing/policy screens.
5) Polish & hardening: accessibility, empty/error states, observability, e2e coverage.

## Next Steps
- Confirm backend endpoint contracts per role; map each page to exact calls.
- Lock capability matrix and navigation for initial release; feature-flag risky areas.
- Prioritize slice sequencing based on backend readiness and stakeholder needs.
