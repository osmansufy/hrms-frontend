# Break Tracking Frontend Implementation

## Overview

Enterprise-grade frontend implementation for attendance break tracking system built with Next.js, React Query, and TypeScript. This document provides comprehensive guidance for using, maintaining, and extending the break tracking features.

**Version:** 1.0.0  
**Last Updated:** February 6, 2026  
**Author:** Senior Frontend Engineer (20 years experience)

---

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Component API Reference](#component-api-reference)
4. [API Integration](#api-integration)
5. [Usage Examples](#usage-examples)
6. [State Management](#state-management)
7. [Business Rules](#business-rules)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)
10. [Performance Optimization](#performance-optimization)

---

## Architecture

### Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **State Management:** TanStack React Query v5
- **Type Safety:** TypeScript 5+
- **UI Components:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS
- **Date Handling:** date-fns
- **Notifications:** sonner (toast)

### Directory Structure

```
frontend/src/
├── app/dashboard/
│   ├── employee/attendance/
│   │   ├── page.tsx                    # Employee attendance page (break UI integrated)
│   │   └── components/
│   │       ├── break-tracker.tsx       # Main break control component
│   │       ├── break-history-card.tsx  # Today's break history
│   │       ├── break-stats-card.tsx    # Monthly statistics
│   │       └── ...
│   └── admin/attendance/
│       └── components/
│           ├── break-monitor-card.tsx  # Admin break monitoring
│           └── attendance-records-tab.tsx
├── lib/
│   ├── api/
│   │   └── attendance.ts               # API functions + types
│   └── queries/
│       └── attendance.ts               # React Query hooks
└── components/
    └── ui/                             # Reusable UI primitives
```

### Data Flow

```
User Interaction
      ↓
React Component (BreakTracker)
      ↓
React Query Hook (useStartBreak)
      ↓
API Service Function (startBreak)
      ↓
Axios Client (apiClient)
      ↓
Backend API (/attendance/breaks/start)
      ↓
Response + Cache Invalidation
      ↓
UI Auto-Refresh
```

---

## Features

### Employee Features

✅ **Start Break**
- 6 break types (Lunch, Tea, Prayer, Medical, Personal, Other)
- Optional notes (500 char max)
- Real-time validation
- Optimistic UI updates

✅ **Active Break Timer**
- Real-time countdown display (HH:MM format)
- Visual warnings at 60 and 120 minutes
- Auto-refresh every 30 seconds
- Manual end break button

✅ **Break History**
- Today's break list with durations
- Total time and count summary
- Break type distribution
- Daily limit tracking (180 min)

✅ **Monthly Statistics**
- Total breaks taken
- Total time spent
- Average break duration
- Daily average breaks

### Admin Features

✅ **Break Monitoring**
- View all breaks per attendance record
- Policy compliance indicators
- Break timeline view
- Type distribution analytics
- Active break highlighting

✅ **Integration**
- Embedded in employee detail sheet
- Real-time status updates
- Export-ready data structure

---

## Component API Reference

### BreakTracker

Main component for starting and managing breaks.

**Location:** `/app/dashboard/employee/attendance/components/break-tracker.tsx`

**Props:** None (uses session context internally)

**Features:**
- Break type selection dropdown
- Notes textarea (optional)
- Real-time active break timer
- Start/end break actions
- Business rule enforcement

**Example:**
```tsx
import { BreakTracker } from "./components/break-tracker";

export default function AttendancePage() {
  return (
    <div>
      <BreakTracker />
    </div>
  );
}
```

---

### BreakHistoryCard

Displays today's break history with analytics.

**Location:** `/app/dashboard/employee/attendance/components/break-history-card.tsx`

**Props:** None (fetches data internally)

**Features:**
- Today's break list
- Total time calculation
- Daily limit warnings
- Break type breakdown
- Empty state handling

**Example:**
```tsx
import { BreakHistoryCard } from "./components/break-history-card";

<BreakHistoryCard />
```

---

### BreakStatsCard

Monthly break statistics dashboard.

**Location:** `/app/dashboard/employee/attendance/components/break-stats-card.tsx`

**Props:** None (fetches current month data)

**Features:**
- Total breaks count
- Total time spent
- Average break duration
- Daily average breaks

**Example:**
```tsx
import { BreakStatsCard } from "./components/break-stats-card";

<BreakStatsCard />
```

---

### BreakMonitorCard (Admin)

Admin component for monitoring employee breaks.

**Location:** `/app/dashboard/admin/attendance/components/break-monitor-card.tsx`

**Props:**
```typescript
interface BreakMonitorCardProps {
  attendanceId: string;          // Required: Attendance record ID
  employeeName?: string;         // Optional: Employee name for display
  signInTime?: string | null;    // Optional: Sign-in timestamp
  signOutTime?: string | null;   // Optional: Sign-out timestamp
}
```

**Features:**
- Break timeline view
- Policy compliance check
- Active break status
- Break type distribution
- Summary statistics

**Example:**
```tsx
<BreakMonitorCard
  attendanceId="att_123"
  employeeName="John Doe"
  signInTime="2024-01-01T09:00:00Z"
  signOutTime="2024-01-01T17:00:00Z"
/>
```

---

## API Integration

### Type Definitions

All types are defined in `/lib/api/attendance.ts`:

```typescript
// Break Type Enum
export enum BreakType {
  LUNCH = "LUNCH",
  TEA = "TEA",
  PRAYER = "PRAYER",
  MEDICAL = "MEDICAL",
  PERSONAL = "PERSONAL",
  OTHER = "OTHER",
}

// Break Record
export type AttendanceBreak = {
  id: string;
  attendanceId: string;
  userId: string;
  breakType: BreakType;
  startTime: string;              // ISO DateTime
  endTime: string | null;         // null if active
  durationMinutes: number | null; // calculated on backend
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// API Response Types
export type AttendanceBreakResponse = {
  success: boolean;
  data: AttendanceBreak;
};

export type AttendanceBreakListResponse = {
  success: boolean;
  data: AttendanceBreak[];
  total: number;
};
```

### API Functions

**Start Break:**
```typescript
startBreak(payload: {
  breakType: BreakType;
  notes?: string;
}): Promise<AttendanceBreakResponse>
```

**End Break:**
```typescript
endBreak(breakId: string): Promise<AttendanceBreakResponse>
```

**Get Active Break:**
```typescript
getActiveBreak(): Promise<AttendanceBreakResponse>
```

**Get My Breaks:**
```typescript
getMyBreaks(params?: {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}): Promise<AttendanceBreakListResponse>
```

**Get Attendance Breaks (Admin):**
```typescript
getAttendanceBreaks(attendanceId: string): Promise<AttendanceBreakListResponse>
```

### Utility Functions

**Calculate Break Summary:**
```typescript
calculateBreakSummary(breaks: AttendanceBreak[]): BreakSummary
```

**Format Break Duration:**
```typescript
formatBreakDuration(minutes: number): string
// Examples: "45m", "1h 30m", "2h"
```

**Get Break Type Label:**
```typescript
getBreakTypeLabel(type: BreakType): string
// Returns: "Lunch Break", "Tea Break", etc.
```

**Get Break Type Icon:**
```typescript
getBreakTypeIcon(type: BreakType): string
// Returns: "🍽️", "☕", "🙏", "🏥", "👤", "⏸️"
```

---

## Usage Examples

### Basic Integration

**Employee Attendance Page:**
```tsx
"use client";

import { useSession } from "@/components/auth/session-provider";
import { useTodayAttendance } from "@/lib/queries/attendance";
import { BreakTracker } from "./components/break-tracker";
import { BreakHistoryCard } from "./components/break-history-card";
import { BreakStatsCard } from "./components/break-stats-card";

export default function AttendancePage() {
  const { session } = useSession();
  const { data } = useTodayAttendance(session?.user.id);

  const isSignedIn = data && !data.signOut;

  return (
    <div className="container space-y-6">
      <h1>Attendance</h1>

      {/* Only show break tracking when signed in */}
      {isSignedIn && (
        <>
          <BreakStatsCard />
          
          <div className="grid gap-6 md:grid-cols-2">
            <BreakTracker />
            <BreakHistoryCard />
          </div>
        </>
      )}
    </div>
  );
}
```

### Custom Break Dashboard

```tsx
"use client";

import { useMyBreaks, useActiveBreak } from "@/lib/queries/attendance";
import { calculateBreakSummary, formatBreakDuration } from "@/lib/api/attendance";
import { useMemo } from "react";

export function CustomBreakDashboard() {
  // Fetch today's breaks
  const { data: response } = useMyBreaks({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Get active break
  const { data: activeBreakResponse } = useActiveBreak();

  const breaks = response?.data || [];
  const summary = useMemo(() => calculateBreakSummary(breaks), [breaks]);

  return (
    <div>
      <h2>Today's Break Summary</h2>
      <p>Total Breaks: {summary.totalBreaks}</p>
      <p>Total Time: {formatBreakDuration(summary.totalMinutes)}</p>
      
      {summary.activeBreak && (
        <div className="alert">
          Active break in progress!
        </div>
      )}
    </div>
  );
}
```

### Admin Break Report

```tsx
"use client";

import { useAttendanceBreaks } from "@/lib/queries/attendance";
import { BreakMonitorCard } from "./break-monitor-card";

export function AttendanceDetailView({ attendanceId }: { attendanceId: string }) {
  const { data, isLoading } = useAttendanceBreaks(attendanceId);

  if (isLoading) return <div>Loading...</div>;

  const breaks = data?.data || [];

  return (
    <div>
      <h2>Attendance Details</h2>
      
      {breaks.length > 0 ? (
        <BreakMonitorCard attendanceId={attendanceId} />
      ) : (
        <p>No breaks recorded</p>
      )}
    </div>
  );
}
```

---

## State Management

### React Query Configuration

**Cache Keys:**
```typescript
attendanceKeys.breaks = {
  active: () => ["attendance", "breaks", "active"],
  myBreaks: (params) => ["attendance", "breaks", "my", params],
  attendanceBreaks: (id) => ["attendance", "breaks", "attendance", id],
}
```

**Refetch Intervals:**
- Active break: 30 seconds (real-time timer)
- My breaks: Manual refetch on mutations
- Attendance breaks: Manual refetch on mutations

**Cache Invalidation:**
```typescript
// After starting break:
- attendanceKeys.breaks.active()
- attendanceKeys.breaks.myBreaks()
- attendanceKeys.today(userId)

// After ending break:
- attendanceKeys.breaks.active()
- attendanceKeys.breaks.myBreaks()
- attendanceKeys.today(userId)
```

### Optimistic Updates

Both `useStartBreak` and `useEndBreak` hooks implement optimistic updates:

```typescript
const startBreakMutation = useStartBreak(userId);

// Usage:
startBreakMutation.mutate({
  breakType: BreakType.LUNCH,
  notes: "Going for lunch",
});
```

**On Success:**
- Toast notification: "Break started successfully"
- Cache invalidation (automatic refetch)

**On Error:**
- Toast notification with error message
- No cache update (rollback)

---

## Business Rules

### Break Duration Limits

| Rule | Limit | Enforcement |
|------|-------|-------------|
| Minimum break | 5 minutes | Backend validation |
| Maximum break | 120 minutes | Backend + UI warning |
| Daily total | 180 minutes | Backend + UI warning |

### Break Validation

**Frontend Validation:**
- Break type required
- Notes max length: 500 characters
- Cannot start break when one is active

**Backend Validation:**
- User must be signed in today
- Only one active break allowed
- Break times must be valid
- Duration limits enforced

### Auto-Close Behavior

Breaks are automatically closed when user signs out:
- Sets `endTime` to sign-out time
- Calculates final `durationMinutes`
- Errors don't block sign-out

---

## Testing Guide

### Unit Testing

**Test Active Break Timer:**
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { BreakTracker } from './break-tracker';
import { useActiveBreak } from '@/lib/queries/attendance';

jest.mock('@/lib/queries/attendance');

test('displays active break timer', async () => {
  (useActiveBreak as jest.Mock).mockReturnValue({
    data: {
      data: {
        id: '1',
        startTime: new Date().toISOString(),
        breakType: 'LUNCH',
        endTime: null,
      },
    },
  });

  render(<BreakTracker />);

  await waitFor(() => {
    expect(screen.getByText(/Elapsed Time/i)).toBeInTheDocument();
  });
});
```

### Integration Testing

**Test Break Flow:**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BreakTracker } from './break-tracker';

test('complete break flow', async () => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <BreakTracker />
    </QueryClientProvider>
  );

  // Select break type
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByText('Lunch Break'));

  // Start break
  fireEvent.click(screen.getByText('Start Break'));

  // Verify success
  await waitFor(() => {
    expect(screen.getByText('Break Active')).toBeInTheDocument();
  });
});
```

---

## Troubleshooting

### Common Issues

**Issue: "Failed to start break"**
- **Cause:** User not signed in or already has active break
- **Solution:** Verify attendance record exists and no active break

**Issue: Timer not updating**
- **Cause:** Refetch interval disabled or network issues
- **Solution:** Check React Query devtools, verify 30s refetch interval

**Issue: Break not appearing in history**
- **Cause:** Date filter mismatch or cache not invalidated
- **Solution:** Check date format (YYYY-MM-DD), force refetch

**Issue: Admin can't see breaks**
- **Cause:** Missing attendanceId or unauthorized
- **Solution:** Verify attendance record ID and admin permissions

### Debug Mode

Enable React Query devtools:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

Check cache state:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
const breakCache = queryClient.getQueryData(attendanceKeys.breaks.active());
console.log('Active break cache:', breakCache);
```

---

## Performance Optimization

### Best Practices

✅ **Lazy Loading:**
```tsx
import dynamic from 'next/dynamic';

const BreakTracker = dynamic(() => 
  import('./components/break-tracker').then(mod => ({ default: mod.BreakTracker })),
  { ssr: false }
);
```

✅ **Memoization:**
```tsx
const summary = useMemo(() => calculateBreakSummary(breaks), [breaks]);
```

✅ **Conditional Rendering:**
```tsx
{isSignedIn && <BreakTracker />} // Only render when needed
```

✅ **Debounced Inputs:**
```tsx
const [notes, setNotes] = useState("");
const debouncedNotes = useDebounce(notes, 500);
```

### Bundle Size

Estimated component sizes:
- BreakTracker: ~8KB
- BreakHistoryCard: ~6KB
- BreakStatsCard: ~4KB
- BreakMonitorCard: ~7KB

**Total bundle impact:** ~25KB (gzipped: ~8KB)

### Rendering Performance

Components use React best practices:
- Minimal re-renders with `useMemo` and `useCallback`
- Proper dependency arrays in `useEffect`
- Skeleton loaders for perceived performance
- Optimistic updates for instant feedback

---

## Migration Guide

### From Previous System

If migrating from an older break tracking system:

1. **Data Migration:**
   - Backend handles nullable `actualBreakMinutes` field
   - Fallback logic: `actualBreakMinutes ?? policy?.breakMinutes ?? 0`

2. **Component Migration:**
   ```tsx
   // Old:
   <LegacyBreakTimer />

   // New:
   <BreakTracker />
   <BreakHistoryCard />
   ```

3. **API Migration:**
   ```typescript
   // Old:
   await api.post('/breaks/start', { type: 'lunch' });

   // New:
   await startBreak({ breakType: BreakType.LUNCH });
   ```

---

## API Endpoints Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/attendance/breaks/start` | POST | Start new break | Employee |
| `/attendance/breaks/:id/end` | PATCH | End active break | Employee |
| `/attendance/breaks/active` | GET | Get active break | Employee |
| `/attendance/breaks/my-breaks` | GET | Get break history | Employee |
| `/attendance/breaks/admin/attendance/:id` | GET | Get attendance breaks | Admin |

---

## Support & Resources

### Documentation
- Backend API: `/backend/ATTENDANCE_BREAK_ARCHITECTURE.md`
- Production Guide: `/PRODUCTION_READINESS_BREAK_TRACKING.md`
- Implementation Summary: `/ATTENDANCE_BREAK_IMPLEMENTATION_COMPLETE.md`

### Related Features
- Attendance System: `/frontend/ATTENDANCE_MODULE_README.md`
- Admin Dashboard: `/frontend/ADMIN_DASHBOARD_QUICK_REFERENCE.md`

### Code Examples
- Employee Page: `/app/dashboard/employee/attendance/page.tsx`
- Admin Integration: `/app/dashboard/admin/attendance/components/attendance-records-tab.tsx`

---

## Changelog

### Version 1.0.0 (2026-02-06)
- ✅ Initial release
- ✅ Complete employee break tracking UI
- ✅ Admin monitoring components
- ✅ Real-time timer updates
- ✅ Monthly statistics dashboard
- ✅ Policy compliance indicators
- ✅ TypeScript type safety
- ✅ React Query integration
- ✅ Comprehensive documentation

---

## License

Internal HRMS System - Proprietary  
© 2026 All Rights Reserved

---

**End of Documentation**

For additional support, contact the development team or refer to the backend documentation for API details.
