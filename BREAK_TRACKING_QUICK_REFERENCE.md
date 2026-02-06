# Break Tracking - Quick Reference Guide

## 🚀 Quick Start

### For Employees

**Start a Break:**
1. Navigate to Attendance page
2. Ensure you're signed in
3. Select break type from dropdown
4. (Optional) Add notes
5. Click "Start Break"

**End a Break:**
1. Active break timer appears
2. Click "End Break" button when ready
3. Break automatically saved to history

**View Statistics:**
- Monthly stats shown at top (4 cards)
- Today's breaks shown in right panel
- Total time and compliance indicators

---

## 🎯 Break Types

| Icon | Type | Label | Common Use |
|------|------|-------|------------|
| 🍽️ | LUNCH | Lunch Break | Main meal break |
| ☕ | TEA | Tea Break | Short coffee/tea break |
| 🙏 | PRAYER | Prayer Break | Religious observance |
| 🏥 | MEDICAL | Medical Break | Health/medical needs |
| 👤 | PERSONAL | Personal Break | Personal matters |
| ⏸️ | OTHER | Other Break | Other purposes |

---

## ⚖️ Business Rules

### Break Limits
- **Minimum:** 5 minutes per break
- **Maximum:** 120 minutes (2 hours) per break
- **Daily Total:** 180 minutes (3 hours) maximum

### Warnings
- ⚠️ Yellow warning at 60 minutes (1 hour)
- 🚨 Red warning at 120 minutes (2 hours)
- 🛑 Daily limit alert at 144 minutes (80% of limit)

### Automatic Actions
- Breaks auto-close when you sign out
- Timer updates every second
- Data refreshes every 30 seconds

---

## 📍 Component Locations

### Employee View
```
/dashboard/employee/attendance
├── Monthly Stats (4 cards at top)
├── Break Tracker (left panel)
└── Break History (right panel)
```

### Admin View
```
/dashboard/admin/attendance
└── Records Tab
    └── Click employee info button
        └── Employee Detail Sheet
            └── Break Activity Card
```

---

## 🔧 Developer Quick Reference

### Import Components

```tsx
// Employee components
import { BreakTracker } from "./components/break-tracker";
import { BreakHistoryCard } from "./components/break-history-card";
import { BreakStatsCard } from "./components/break-stats-card";

// Admin component
import { BreakMonitorCard } from "./components/break-monitor-card";
```

### Import Hooks

```tsx
import {
  useActiveBreak,
  useMyBreaks,
  useStartBreak,
  useEndBreak,
  useAttendanceBreaks, // Admin only
} from "@/lib/queries/attendance";
```

### Import Types

```tsx
import {
  BreakType,
  AttendanceBreak,
  AttendanceBreakResponse,
  AttendanceBreakListResponse,
  BreakSummary,
} from "@/lib/api/attendance";
```

### Import Utilities

```tsx
import {
  calculateBreakSummary,
  formatBreakDuration,
  getBreakTypeLabel,
  getBreakTypeIcon,
} from "@/lib/api/attendance";
```

---

## 📝 Common Code Patterns

### Start a Break

```tsx
const { session } = useSession();
const startBreak = useStartBreak(session?.user.id);

const handleStart = () => {
  startBreak.mutate({
    breakType: BreakType.LUNCH,
    notes: "Going for lunch",
  });
};
```

### End a Break

```tsx
const { session } = useSession();
const endBreak = useEndBreak(session?.user.id);

const handleEnd = (breakId: string) => {
  endBreak.mutate(breakId);
};
```

### Get Active Break

```tsx
const { data: activeBreakResponse, isLoading } = useActiveBreak();
const activeBreak = activeBreakResponse?.data;

if (activeBreak) {
  console.log("Break started at:", activeBreak.startTime);
}
```

### Get Break History

```tsx
const { data: response } = useMyBreaks({
  startDate: "2024-01-01",
  endDate: "2024-01-31",
});

const breaks = response?.data || [];
```

### Calculate Statistics

```tsx
const summary = calculateBreakSummary(breaks);

console.log("Total breaks:", summary.totalBreaks);
console.log("Total minutes:", summary.totalMinutes);
console.log("Active break:", summary.activeBreak);
console.log("By type:", summary.byType);
```

### Format Duration

```tsx
formatBreakDuration(45);   // "45m"
formatBreakDuration(90);   // "1h 30m"
formatBreakDuration(120);  // "2h"
```

---

## 🎨 Styling Reference

### Break Status Colors

```tsx
// Active break
className="border-orange-300 bg-orange-50/50"

// Completed break
className="border-border bg-card"

// Warning (60-120 min)
className="bg-yellow-50 text-yellow-800"

// Over limit (>120 min)
className="bg-destructive/10 text-destructive"
```

### Badge Variants

```tsx
<Badge variant="default">Active</Badge>
<Badge variant="secondary">On Time</Badge>
<Badge variant="destructive">Over Limit</Badge>
```

---

## 🐛 Troubleshooting

### Break Not Starting

**Problem:** "Failed to start break" error

**Solutions:**
1. Verify you're signed in for today
2. Check if you have an active break
3. Ensure break type is selected
4. Check network connection

### Timer Not Updating

**Problem:** Active break timer frozen

**Solutions:**
1. Check React Query refetch interval (should be 30s)
2. Verify component is mounted
3. Check browser console for errors
4. Force refetch with queryClient

### History Not Showing

**Problem:** Breaks not appearing in history

**Solutions:**
1. Verify date filter (today's date)
2. Check API response in Network tab
3. Ensure breaks are completed (have endTime)
4. Invalidate query cache manually

### Admin View Empty

**Problem:** BreakMonitorCard shows no data

**Solutions:**
1. Verify attendance record has breaks
2. Check attendanceId prop is correct
3. Ensure admin permissions
4. Check API endpoint response

---

## 🔍 Debug Helpers

### React Query DevTools

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Check Cache State

```tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
const cache = queryClient.getQueryData(['attendance', 'breaks', 'active']);
console.log('Cache:', cache);
```

### Force Refetch

```tsx
const { refetch } = useActiveBreak();

// Manually trigger refetch
refetch();
```

### Invalidate Cache

```tsx
const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: ['attendance', 'breaks', 'active'],
});

// Invalidate all break queries
queryClient.invalidateQueries({
  queryKey: ['attendance', 'breaks'],
});
```

---

## 📊 API Endpoints

### Employee Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/attendance/breaks/start` | POST | Start new break |
| `/attendance/breaks/:id/end` | PATCH | End active break |
| `/attendance/breaks/active` | GET | Get active break |
| `/attendance/breaks/my-breaks` | GET | Get break history |

### Admin Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/attendance/breaks/admin/attendance/:id` | GET | Get attendance breaks |

### Request Examples

**Start Break:**
```json
POST /attendance/breaks/start
{
  "breakType": "LUNCH",
  "notes": "Going for lunch"
}
```

**End Break:**
```json
PATCH /attendance/breaks/123/end
{}
```

**Get My Breaks:**
```
GET /attendance/breaks/my-breaks?startDate=2024-01-01&endDate=2024-01-31
```

---

## ⚡ Performance Tips

### Optimization Checklist
- ✅ Use `useMemo` for expensive calculations
- ✅ Use `useCallback` for event handlers
- ✅ Lazy load components with `dynamic()`
- ✅ Implement proper loading states
- ✅ Use skeleton loaders for UX
- ✅ Debounce user inputs
- ✅ Proper dependency arrays in hooks

### Code Examples

**Memoized Calculation:**
```tsx
const summary = useMemo(() => 
  calculateBreakSummary(breaks), 
  [breaks]
);
```

**Lazy Loading:**
```tsx
import dynamic from 'next/dynamic';

const BreakTracker = dynamic(
  () => import('./break-tracker').then(m => ({ default: m.BreakTracker })),
  { ssr: false, loading: () => <Skeleton /> }
);
```

---

## 📱 Mobile Considerations

### Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (full layout)

### Touch Targets
- Minimum: 44x44px for touch
- Buttons: Large size on mobile
- Dropdowns: Native on mobile

---

## ♿ Accessibility

### Keyboard Navigation
- Tab: Navigate between elements
- Space/Enter: Activate buttons
- Arrow keys: Navigate dropdowns
- Escape: Close dialogs

### Screen Reader Support
- Proper ARIA labels on all controls
- Live regions for timer updates
- Semantic HTML structure
- Alt text for icons (via aria-label)

---

## 📚 Documentation Links

### Full Documentation
- **Frontend Guide:** `/frontend/BREAK_TRACKING_FRONTEND.md` (3000+ lines)
- **Backend API:** `/backend/ATTENDANCE_BREAK_ARCHITECTURE.md`
- **Implementation Summary:** `/frontend/BREAK_TRACKING_IMPLEMENTATION_SUMMARY.md`

### Code Files
- **Types:** `/frontend/src/lib/api/attendance.ts`
- **Hooks:** `/frontend/src/lib/queries/attendance.ts`
- **Components:** `/frontend/src/app/dashboard/employee/attendance/components/`

---

## 🎯 Common Tasks

### Add New Break Type

1. Update BreakType enum:
```tsx
export enum BreakType {
  // ... existing types
  SMOKE = "SMOKE",
}
```

2. Update label function:
```tsx
[BreakType.SMOKE]: "Smoke Break",
```

3. Update icon function:
```tsx
[BreakType.SMOKE]: "🚬",
```

### Customize Break Limits

Update constants in components:
```tsx
const dailyLimit = 180; // Change to new limit
const maxBreakDuration = 120; // Change max per break
const warningThreshold = 60; // Change warning time
```

### Change Refetch Interval

Update in hooks:
```tsx
export function useActiveBreak() {
  return useQuery({
    queryKey: attendanceKeys.breaks.active(),
    queryFn: getActiveBreak,
    refetchInterval: 60_000, // Change to 60 seconds
  });
}
```

---

## 🆘 Support

### Getting Help
1. Check troubleshooting section above
2. Review full documentation
3. Check browser console for errors
4. Contact development team

### Reporting Issues
Include:
- Browser and version
- Error message/screenshot
- Steps to reproduce
- Expected vs actual behavior

---

**Last Updated:** February 6, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
