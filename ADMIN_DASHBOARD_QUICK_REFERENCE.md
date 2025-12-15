# Admin Dashboard API - Quick Reference

## 🚀 Quick Start

```typescript
// 1. Import hooks
import {
  useAdminLeaveBalances,
  useBulkAdjustBalances,
  downloadCSV,
} from "@/lib/queries/admin-leave-balances";

// 2. Use in component
const { data, isLoading } = useAdminLeaveBalances({ page: 1, pageSize: 20 });
const adjustMutation = useBulkAdjustBalances();

// 3. Perform actions
await adjustMutation.mutateAsync({ items: [...] });
```

## 📋 Function Reference

### Query Functions (GET)

| Function | Endpoint | Returns |
|----------|----------|---------|
| `getAdminLeaveBalances(params)` | `/admin/leave-balances` | Paginated balances |
| `getAdminBalanceSummary(year)` | `/admin/leave-balances/summary` | Statistics |
| `getAdminBalanceAlerts(year)` | `/admin/leave-balances/alerts` | Alert list |
| `getAdminAdjustmentHistory(params)` | `/admin/leave-balances/adjustments` | Audit trail |

### Mutation Functions (POST)

| Function | Endpoint | Action |
|----------|----------|--------|
| `bulkInitializeBalances(payload)` | `/admin/leave-balances/bulk-initialize` | Initialize |
| `bulkAdjustBalances(payload)` | `/admin/leave-balances/bulk-adjust` | Adjust |
| `exportBalances(params)` | `/admin/leave-balances/export` | Export CSV |

### React Query Hooks

| Hook | Type | Auto-refetch |
|------|------|--------------|
| `useAdminLeaveBalances(params)` | Query | 30s |
| `useAdminBalanceSummary(year)` | Query | 60s |
| `useAdminBalanceAlerts(year)` | Query | 30s |
| `useAdminAdjustmentHistory(params)` | Query | 30s |
| `useBulkInitializeBalances()` | Mutation | - |
| `useBulkAdjustBalances()` | Mutation | - |
| `useExportBalances()` | Mutation | - |

## 💡 Common Use Cases

### 1. Display Balance List
```typescript
const { data, isLoading } = useAdminLeaveBalances({
  page: 1,
  pageSize: 20,
  status: "low"
});
```

### 2. Show Summary Stats
```typescript
const { data: summary } = useAdminBalanceSummary(2025);
// Access: summary.overview.totalEmployees
```

### 3. Display Alerts
```typescript
const { data: alerts } = useAdminBalanceAlerts(2025);
// Access: alerts.alerts.negativeBalances
```

### 4. Bulk Initialize
```typescript
const mutation = useBulkInitializeBalances();
await mutation.mutateAsync({
  items: [{ userId, leaveTypeId, initialBalance }],
  reason: "Annual allocation"
});
```

### 5. Bulk Adjust
```typescript
const mutation = useBulkAdjustBalances();
await mutation.mutateAsync({
  items: [{ userId, leaveTypeId, adjustment, reason }]
});
```

### 6. Export CSV
```typescript
const mutation = useExportBalances();
const blob = await mutation.mutateAsync({ year: 2025 });
downloadCSV(blob, "balances.csv");
```

## 🔍 Filter Options

### getAdminLeaveBalances
```typescript
{
  page?: number;           // Page number (1-indexed)
  pageSize?: number;       // Items per page (max 100)
  departmentId?: string;   // Filter by department
  leaveTypeId?: string;    // Filter by leave type
  year?: number;           // Filter by year
  status?: "low" | "normal" | "negative";
  search?: string;         // Search by name/email/code
}
```

### getAdminAdjustmentHistory
```typescript
{
  page?: number;
  pageSize?: number;
  startDate?: string;      // ISO 8601 format
  endDate?: string;        // ISO 8601 format
  userId?: string;
  adminId?: string;
  leaveTypeId?: string;
}
```

## 📊 Response Structures

### Balance Item
```typescript
{
  id: string;
  employee: { name, email, employeeCode, department };
  leaveType: { id, name, code };
  balances: {
    available: number;
    used: number;
    pending: number;
    // ... more
  };
  status: "NORMAL" | "LOW" | "NEGATIVE";
}
```

### Summary
```typescript
{
  overview: {
    totalEmployees: number;
    totalDaysAllocated: number;
    overallUtilizationRate: number;
    // ... more
  };
  byDepartment: Array<{...}>;
  byLeaveType: Array<{...}>;
}
```

### Alerts
```typescript
{
  summary: {
    totalAlerts: number;
    critical: number;
    warnings: number;
    info: number;
  };
  alerts: {
    negativeBalances: Array<{...}>;
    highUsage: Array<{...}>;
    unusualAdjustments: Array<{...}>;
    approachingLimits: Array<{...}>;
  };
}
```

## ⚠️ Error Handling

```typescript
try {
  const result = await mutation.mutateAsync(payload);
  if (result.summary.failed > 0) {
    // Handle partial failures
    console.error(result.failed);
  }
} catch (error) {
  // Handle complete failure
  console.error(error);
}
```

## 🔑 Authorization

Required roles:
- `ADMIN`
- `HR_MANAGER`

Automatically handled by `apiClient`.

## 🎨 Status Colors

```typescript
const statusColor = {
  NEGATIVE: "red",    // Critical
  LOW: "yellow",      // Warning
  NORMAL: "green"     // Good
};
```

## 📱 Pagination Helper

```typescript
const currentPage = data.pagination.page;
const totalPages = data.pagination.totalPages;
const canGoNext = currentPage < totalPages;
const canGoPrev = currentPage > 1;
```

## 🔄 Cache Invalidation

Bulk operations automatically invalidate all admin balance queries:
```typescript
// After bulkAdjustBalances or bulkInitializeBalances
// All queries with key ["admin", "leave-balances"] are refetched
```

Manual invalidation:
```typescript
import { useQueryClient } from "@tanstack/react-query";
import { adminBalanceKeys } from "@/lib/queries/admin-leave-balances";

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: adminBalanceKeys.all });
```

## 📝 TypeScript Tips

All types are exported from `/lib/api/leave.ts`:
```typescript
import type {
  AdminLeaveBalancesParams,
  AdminLeaveBalanceItem,
  BulkAdjustPayload,
  // ... more
} from "@/lib/api/leave";
```

## 🔗 Related Files

- **API Functions**: `frontend/src/lib/api/leave.ts`
- **Query Hooks**: `frontend/src/lib/queries/admin-leave-balances.ts`
- **Full Docs**: `frontend/ADMIN_DASHBOARD_API_FUNCTIONS.md`
- **Example**: `frontend/ADMIN_DASHBOARD_EXAMPLE_COMPONENT.tsx`
- **Backend Docs**: `backend/docs/ADMIN_LEAVE_BALANCE_API.md`

## ✅ Checklist

- [ ] Import hooks from `@/lib/queries/admin-leave-balances`
- [ ] Use hooks in component with proper types
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Implement pagination if needed
- [ ] Add filters if needed
- [ ] Handle bulk operation results (successful/failed)
- [ ] Test with backend API
- [ ] Add toast notifications
- [ ] Verify authorization (ADMIN/HR_MANAGER role)

---

**Quick Copy-Paste Templates**: See `ADMIN_DASHBOARD_EXAMPLE_COMPONENT.tsx`

**Need Help?**: Check `ADMIN_DASHBOARD_API_FUNCTIONS.md` for detailed examples
