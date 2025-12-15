# Admin Dashboard API Functions

## Overview

Added comprehensive admin dashboard API functions to `/frontend/src/lib/api/leave.ts` for managing leave balances through the backend admin endpoints.

## Added Functions

### 1. `getAdminLeaveBalances(params?)`
**Endpoint:** `GET /admin/leave-balances`

Get paginated list of all employee leave balances with advanced filtering.

**Parameters:**
```typescript
{
  page?: number;
  pageSize?: number;
  departmentId?: string;
  leaveTypeId?: string;
  year?: number;
  status?: "low" | "normal" | "negative";
  search?: string;
}
```

**Returns:**
- `data`: Array of leave balance items with employee details
- `pagination`: Page info (page, pageSize, totalCount, totalPages)
- `statistics`: Summary stats (totalEmployees, negativeBalances, etc.)

**Usage Example:**
```typescript
import { getAdminLeaveBalances } from "@/lib/api/leave";

const balances = await getAdminLeaveBalances({
  page: 1,
  pageSize: 20,
  departmentId: "dept_engineering",
  status: "low"
});
```

---

### 2. `getAdminBalanceSummary(year?)`
**Endpoint:** `GET /admin/leave-balances/summary`

Get comprehensive summary statistics for leave balances.

**Parameters:**
- `year?: number` - Optional year filter

**Returns:**
- `overview`: Total stats (employees, days allocated/used/available)
- `byDepartment`: Breakdown by department with utilization rates
- `byLeaveType`: Breakdown by leave type with utilization rates

**Usage Example:**
```typescript
import { getAdminBalanceSummary } from "@/lib/api/leave";

const summary = await getAdminBalanceSummary(2025);
console.log(`Utilization Rate: ${summary.overview.overallUtilizationRate}%`);
```

---

### 3. `getAdminBalanceAlerts(year?)`
**Endpoint:** `GET /admin/leave-balances/alerts`

Get alerts for problematic leave balances.

**Parameters:**
- `year?: number` - Optional year filter

**Returns:**
- `summary`: Alert counts by severity (critical, warnings, info)
- `alerts`: Categorized alerts
  - `negativeBalances`: Employees with balance < 0
  - `highUsage`: Employees who used ≥80% of allocation
  - `unusualAdjustments`: Large adjustments (>10 days)
  - `approachingLimits`: Employees with ≤2 days remaining

**Usage Example:**
```typescript
import { getAdminBalanceAlerts } from "@/lib/api/leave";

const alerts = await getAdminBalanceAlerts(2025);
if (alerts.summary.critical > 0) {
  console.log(`⚠️ ${alerts.summary.critical} critical alerts!`);
  alerts.alerts.negativeBalances.forEach(alert => {
    console.log(`${alert.employee.name}: ${alert.balance} days`);
  });
}
```

---

### 4. `getAdminAdjustmentHistory(params?)`
**Endpoint:** `GET /admin/leave-balances/adjustments`

Get audit trail of balance adjustments with before/after values.

**Parameters:**
```typescript
{
  page?: number;
  pageSize?: number;
  startDate?: string;  // ISO 8601 format
  endDate?: string;    // ISO 8601 format
  userId?: string;
  adminId?: string;
  leaveTypeId?: string;
}
```

**Returns:**
- `data`: Array of adjustment records with before/after balances
- `pagination`: Page info

**Usage Example:**
```typescript
import { getAdminAdjustmentHistory } from "@/lib/api/leave";

const history = await getAdminAdjustmentHistory({
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  userId: "user_123"
});

history.data.forEach(record => {
  console.log(`${record.employee.name}: ${record.balances.before} → ${record.balances.after}`);
});
```

---

### 5. `bulkInitializeBalances(payload)`
**Endpoint:** `POST /admin/leave-balances/bulk-initialize`

Bulk initialize leave balances for multiple employees.

**Parameters:**
```typescript
{
  items: Array<{
    userId: string;
    leaveTypeId: string;
    initialBalance: number;
    accrualRuleId?: string;
  }>;
  reason?: string;
}
```

**Returns:**
- `successful`: Array of successfully initialized balances
- `failed`: Array of failed operations with error messages
- `summary`: Total count, succeeded, and failed counts

**Usage Example:**
```typescript
import { bulkInitializeBalances } from "@/lib/api/leave";

const result = await bulkInitializeBalances({
  items: [
    {
      userId: "user_123",
      leaveTypeId: "lt_annual",
      initialBalance: 20,
      accrualRuleId: "ar_monthly"
    },
    {
      userId: "user_456",
      leaveTypeId: "lt_annual",
      initialBalance: 15
    }
  ],
  reason: "Annual leave allocation for Q1 2025"
});

console.log(`✅ ${result.summary.succeeded} succeeded`);
console.log(`❌ ${result.summary.failed} failed`);
```

---

### 6. `bulkAdjustBalances(payload)`
**Endpoint:** `POST /admin/leave-balances/bulk-adjust`

Bulk adjust leave balances for multiple employees.

**Parameters:**
```typescript
{
  items: Array<{
    userId: string;
    leaveTypeId: string;
    adjustment: number;  // Can be positive or negative
    reason: string;
  }>;
}
```

**Returns:**
- `successful`: Array of successfully adjusted balances with before/after values
- `failed`: Array of failed operations with error messages
- `summary`: Total count, succeeded, and failed counts

**Usage Example:**
```typescript
import { bulkAdjustBalances } from "@/lib/api/leave";

const result = await bulkAdjustBalances({
  items: [
    {
      userId: "user_123",
      leaveTypeId: "lt_annual",
      adjustment: 5,
      reason: "Carry forward from previous year"
    },
    {
      userId: "user_456",
      leaveTypeId: "lt_annual",
      adjustment: -2,
      reason: "Correction for overpayment"
    }
  ]
});

result.successful.forEach(item => {
  console.log(`${item.userName}: ${item.balanceBefore} → ${item.balanceAfter}`);
});
```

---

### 7. `exportBalances(params?)`
**Endpoint:** `GET /admin/leave-balances/export`

Export leave balances to CSV format for download.

**Parameters:**
```typescript
{
  departmentId?: string;
  leaveTypeId?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
}
```

**Returns:**
- `Blob` - CSV file blob ready for download

**Usage Example:**
```typescript
import { exportBalances } from "@/lib/api/leave";

const handleExport = async () => {
  try {
    const blob = await exportBalances({
      departmentId: "dept_engineering",
      year: 2025
    });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_balances_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error);
  }
};
```

---

## TypeScript Types

All functions include comprehensive TypeScript types:

### Main Response Types
- `AdminLeaveBalancesResponse`
- `AdminBalanceSummaryResponse`
- `AdminBalanceAlertsResponse`
- `AdminAdjustmentHistoryResponse`
- `BulkInitializeResponse`
- `BulkAdjustResponse`

### Item Types
- `AdminLeaveBalanceItem`
- `AdminAdjustmentHistoryItem`
- `AdminBalanceAlert`
- `BulkInitializeItem`
- `BulkAdjustItem`

### Parameter Types
- `AdminLeaveBalancesParams`
- `AdminAdjustmentHistoryParams`
- `AdminBalanceExportParams`
- `BulkInitializePayload`
- `BulkAdjustPayload`

---

## Integration with React Query

To use these functions with React Query (recommended pattern):

### Create Query Hooks

Create `/frontend/src/lib/queries/admin-leave-balances.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminLeaveBalances,
  getAdminBalanceSummary,
  getAdminBalanceAlerts,
  getAdminAdjustmentHistory,
  bulkInitializeBalances,
  bulkAdjustBalances,
  exportBalances,
  type AdminLeaveBalancesParams,
  type AdminAdjustmentHistoryParams,
  type BulkInitializePayload,
  type BulkAdjustPayload,
  type AdminBalanceExportParams,
} from "@/lib/api/leave";

// Query keys
export const adminBalanceKeys = {
  all: ["admin", "leave-balances"] as const,
  list: (params?: AdminLeaveBalancesParams) =>
    [...adminBalanceKeys.all, "list", params] as const,
  summary: (year?: number) =>
    [...adminBalanceKeys.all, "summary", year] as const,
  alerts: (year?: number) =>
    [...adminBalanceKeys.all, "alerts", year] as const,
  adjustments: (params?: AdminAdjustmentHistoryParams) =>
    [...adminBalanceKeys.all, "adjustments", params] as const,
};

// Query hooks
export function useAdminLeaveBalances(params?: AdminLeaveBalancesParams) {
  return useQuery({
    queryKey: adminBalanceKeys.list(params),
    queryFn: () => getAdminLeaveBalances(params),
  });
}

export function useAdminBalanceSummary(year?: number) {
  return useQuery({
    queryKey: adminBalanceKeys.summary(year),
    queryFn: () => getAdminBalanceSummary(year),
  });
}

export function useAdminBalanceAlerts(year?: number) {
  return useQuery({
    queryKey: adminBalanceKeys.alerts(year),
    queryFn: () => getAdminBalanceAlerts(year),
  });
}

export function useAdminAdjustmentHistory(params?: AdminAdjustmentHistoryParams) {
  return useQuery({
    queryKey: adminBalanceKeys.adjustments(params),
    queryFn: () => getAdminAdjustmentHistory(params),
  });
}

// Mutation hooks
export function useBulkInitializeBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkInitializePayload) =>
      bulkInitializeBalances(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBalanceKeys.all });
    },
  });
}

export function useBulkAdjustBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAdjustPayload) => bulkAdjustBalances(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBalanceKeys.all });
    },
  });
}

export function useExportBalances() {
  return useMutation({
    mutationFn: (params?: AdminBalanceExportParams) => exportBalances(params),
  });
}
```

### Usage in Components

```typescript
import {
  useAdminLeaveBalances,
  useAdminBalanceSummary,
  useBulkAdjustBalances,
} from "@/lib/queries/admin-leave-balances";

function AdminDashboard() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  // Fetch balances
  const { data: balances, isLoading } = useAdminLeaveBalances({
    page,
    pageSize: 20,
    ...filters,
  });

  // Fetch summary
  const { data: summary } = useAdminBalanceSummary(2025);

  // Bulk adjust mutation
  const adjustMutation = useBulkAdjustBalances();

  const handleBulkAdjust = async (items) => {
    try {
      const result = await adjustMutation.mutateAsync({ items });
      console.log(`✅ ${result.summary.succeeded} adjustments succeeded`);
    } catch (error) {
      console.error("Bulk adjust failed:", error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Render balances, summary, etc. */}
    </div>
  );
}
```

---

## Authorization

All endpoints require:
- **Authentication**: Valid JWT Bearer token
- **Authorization**: `ADMIN` or `HR_MANAGER` role

The `apiClient` from `@/lib/api/client` automatically:
- Adds the Bearer token to requests
- Handles 401 errors with automatic token refresh
- Redirects to login if refresh fails

---

## Error Handling

All functions use the `apiClient` which provides:
- Automatic error parsing
- Token refresh on 401 errors
- Standardized error responses

```typescript
import { parseApiError } from "@/lib/api/client";

try {
  const balances = await getAdminLeaveBalances();
} catch (error) {
  const apiError = parseApiError(error);
  console.error(apiError.message);
  
  if (apiError.status === 403) {
    // Handle insufficient permissions
  }
}
```

---

## Testing

The functions can be tested using the existing backend endpoints. Ensure:
1. Backend server is running
2. You have a valid JWT token with ADMIN/HR_MANAGER role
3. Test data exists in the database

---

## Related Documentation

- **Backend API**: `/backend/docs/ADMIN_LEAVE_BALANCE_API.md`
- **Quick Start**: `/backend/docs/ADMIN_DASHBOARD_QUICK_START.md`
- **API Client**: `/frontend/src/lib/api/client.ts`
- **Session Management**: `/frontend/SESSION_EXPIRATION_ANALYSIS.md`

---

## Next Steps

1. Create React Query hooks (see example above)
2. Build UI components for the admin dashboard
3. Add proper error handling and loading states
4. Implement CSV export functionality
5. Add toast notifications for bulk operations
6. Create filters and search components

---

## Notes

- All date parameters should be in ISO 8601 format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`)
- The `exportBalances` function returns a Blob, use the example code to trigger browser download
- Pagination is 1-indexed (page starts at 1, not 0)
- Maximum page size is 100 items
- All functions include JSDoc comments for IDE IntelliSense support
