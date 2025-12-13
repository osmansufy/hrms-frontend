# Leave Balance - uniqueUsers Fix

## Problem

The `uniqueUsers` array in the admin leave-balance page was empty, preventing administrators from initializing leave balances for employees. This happened because:

1. **Original Implementation**: `uniqueUsers` was derived from the `balances` data
2. **Issue**: When no balances exist yet (initial setup), the `balances` array is empty
3. **Result**: `uniqueUsers` was also empty, making the "Initialize Balance" dialog unusable

## Root Cause

```typescript
// OLD CODE - Derived from balances
const uniqueUsers = Array.from(
    new Set(balances?.map((b) => b.userId) || [])
).map((userId) => {
    const balance = balances?.find((b) => b.userId === userId);
    return {
        id: userId,
        name: `${balance?.user.employee?.firstName || ""} ${balance?.user.employee?.lastName || ""}`.trim() ||
            balance?.user.email ||
            "Unknown",
        code: balance?.user.employee?.employeeCode,
    };
});
```

**Problem**: If `balances` is empty or undefined, `uniqueUsers` will be an empty array.

## Solution

Fetch employees directly from the Employee API instead of deriving them from balances.

### Changes Made

**File**: `/frontend/src/app/dashboard/admin/leave-balance/page.tsx`

#### 1. Updated Imports

```typescript
// Added
import { useQuery } from "@tanstack/react-query";
import { listEmployees, type ApiEmployee } from "@/lib/api/employees";

// Removed
import { useEmployees } from "@/lib/queries/employees";
```

#### 2. Fetch Raw Employee Data

```typescript
// NEW CODE - Direct API query
const { data: employees } = useQuery({
    queryKey: ["employees-raw"],
    queryFn: () => listEmployees(),
});
```

#### 3. Updated uniqueUsers Logic

```typescript
// NEW CODE - Derived from employees API
const uniqueUsers = employees?.map((emp: ApiEmployee) => ({
    id: emp.user?.id || emp.id,  // Use user.id for leave balance initialization
    name: `${emp.firstName} ${emp.lastName}`.trim(),
    code: emp.employeeCode,
    email: emp.user?.email || emp.personalEmail,
})) || [];
```

#### 4. Updated Type Annotation

```typescript
// In the SelectContent dropdown
{uniqueUsers.map((user: { id: string; name: string; code?: string; email?: string | null }) => (
    <SelectItem key={user.id} value={user.id}>
        {user.name} {user.code && `(${user.code})`}
    </SelectItem>
))}
```

## Benefits

### Before Fix
- ❌ `uniqueUsers` was empty when no balances existed
- ❌ Couldn't initialize first balance for any employee
- ❌ Circular dependency: need balances to initialize balances

### After Fix
- ✅ `uniqueUsers` populated from employee data
- ✅ Can initialize balances for any employee
- ✅ Works even when no balances exist
- ✅ Shows all employees in the system

## Data Flow

```
Before:
Balances API → balances → uniqueUsers (empty if no balances)

After:
Employees API → employees → uniqueUsers (always populated)
```

## Testing

### Test 1: Initialize First Balance

1. Login as admin
2. Navigate to "Leave Balances"
3. Click "+ Initialize Balance"
4. Verify dropdown shows all employees
5. Select employee, leave type, and initial balance
6. Submit successfully

**Expected**: Dropdown shows all employees even if no balances exist

### Test 2: Initialize Additional Balance

1. After one balance exists
2. Click "+ Initialize Balance" again
3. Verify dropdown still shows all employees (not just those with balances)
4. Initialize balance for a different employee

**Expected**: All employees available in dropdown

### Test 3: Employee with Multiple Leave Types

1. Initialize "Annual Leave" for John Doe (20 days)
2. Click "+ Initialize Balance" again
3. Select John Doe again
4. Select "Sick Leave"
5. Initialize with 10 days

**Expected**: Can initialize multiple leave types for same employee

## API Structure

### Employee API Response

```typescript
type ApiEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
  personalEmail?: string;
  user?: {
    id: string;
    email: string;
  };
  // ... other fields
};
```

### Key Fields Used

- `emp.user?.id || emp.id` - User ID for leave balance (primary)
- `emp.firstName`, `emp.lastName` - Display name
- `emp.employeeCode` - Employee code (optional)
- `emp.user?.email || emp.personalEmail` - Email for reference

## Edge Cases Handled

1. **No Employees**: If `employees` is undefined, `uniqueUsers` defaults to `[]`
2. **Missing User ID**: Fallback to `emp.id` if `emp.user?.id` is undefined
3. **Missing Email**: Fallback to `personalEmail` if `user.email` is undefined
4. **Missing Code**: Optional field, displayed only if present

## Future Improvements

Potential enhancements:

1. **Search/Filter**: Add search in employee dropdown for large organizations
2. **Employee Status**: Show only active employees in dropdown
3. **Existing Balances Indicator**: Mark employees who already have balances
4. **Department Filter**: Filter employees by department
5. **Bulk Initialization**: Initialize balances for multiple employees at once

## Related Files

- `/frontend/src/lib/api/employees.ts` - Employee API functions
- `/frontend/src/lib/queries/employees.ts` - Employee React Query hooks
- `/frontend/src/app/dashboard/admin/leave-balance/page.tsx` - Admin balance page (fixed)

## Summary

The fix changes the data source for `uniqueUsers` from `balances` (which could be empty) to `employees` (which contains all employees in the system). This ensures the "Initialize Balance" dialog always shows all available employees, even when no balances have been created yet.

**Status**: ✅ Fixed and working
**Date**: December 13, 2025
