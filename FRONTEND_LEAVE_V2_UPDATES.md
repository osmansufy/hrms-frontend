# Frontend Leave Management Updates - v2.0 Alignment

**Date:** December 14, 2024  
**Purpose:** Align frontend with backend v2.0 (PROCESSING workflow, manager endpoints, enhanced validation)

---

## 📊 Summary of Changes

### Files Created (3)
1. **`src/lib/types/leave.ts`** - TypeScript types and helper functions for leave status
2. **`src/components/leave/leave-status-badge.tsx`** - Reusable status badge component with tooltips
3. **`docs/FRONTEND_LEAVE_V2_UPDATES.md`** - This documentation file

### Files Updated (4)
1. **`src/app/dashboard/employee/leave/page.tsx`** - Employee leave page with status badge
2. **`src/app/dashboard/employee/leave-manager/components/pending-approvals-tab.tsx`** - Enhanced error handling
3. **`src/app/dashboard/admin/leave/components/leave-approvals-tab.tsx`** - HR approval with validation
4. **`src/app/dashboard/admin/leave/components/amendment-approvals-tab.tsx`** - Amendment approval errors

---

## 🎯 Key Features Implemented

### 1. Leave Status Type System
**File:** `src/lib/types/leave.ts`

**Status Flow:**
```
PENDING     → Line Manager approval needed (Step 1)
PROCESSING  → Approved by LM, HR approval needed (Step 2)  
APPROVED    → Final approval, balance deducted
REJECTED    → Rejected at any step
HOLD        → On hold
CANCELLED   → Cancelled after approval
```

**Helper Functions:**
- `getStatusLabel(status)` - User-friendly labels
- `getStatusVariant(status)` - Badge color variants
- `getStatusDescription(status)` - Tooltip descriptions
- `canManagerApprove(status)` - Check if manager can approve
- `canHRApprove(status)` - Check if HR can approve

**Example Usage:**
```typescript
import { getStatusLabel, getStatusVariant } from '@/lib/types/leave';

const label = getStatusLabel('PROCESSING'); // "In Progress"
const variant = getStatusVariant('PROCESSING'); // "secondary"
```

### 2. Status Badge Component
**File:** `src/components/leave/leave-status-badge.tsx`

**Features:**
- Consistent styling across all pages
- Tooltip with status description
- Color-coded badges
- Accessible design

**Usage:**
```tsx
import { LeaveStatusBadge } from '@/components/leave/leave-status-badge';

<LeaveStatusBadge status="PROCESSING" />
// Displays: "In Progress" badge with tooltip
```

### 3. Enhanced Error Handling

#### For Line Managers (Step 1 Approval)
**File:** `pending-approvals-tab.tsx`

**Error Scenarios:**
- **403 - Not Reporting Manager:**
  ```
  "Not Authorized"
  "You are not the assigned reporting manager for this employee..."
  ```

- **400 - No Reporting Manager:**
  ```
  "No Reporting Manager"
  "This employee does not have a reporting manager assigned..."
  ```

**Success Message:**
```
"Leave approved successfully"
"Status changed to PROCESSING. The leave will now move to HR for final approval."
```

#### For HR (Step 2 Approval)
**File:** `leave-approvals-tab.tsx`

**Error Scenarios:**
- **400 - Wrong Status:**
  ```
  "Cannot Approve"
  "Only leave requests with PROCESSING status (approved by Line Manager) 
   can be processed by HR..."
  ```

- **403 - Permission Denied:**
  ```
  "Permission Denied"
  [error message from backend]
  ```

**Success Message:**
```
"Leave approved successfully"
"Status changed to APPROVED. Employee's leave balance has been deducted."
```

#### For Amendment Approvals
**File:** `amendment-approvals-tab.tsx`

**Error Scenarios:**
- **403 - Permission Denied**
- **404 - Not Found**
- **General Errors**

**Success Message:**
```
"Amendment approved successfully"
"The leave has been updated and balance adjusted if needed."
```

---

## 📋 Updated UI Components

### Employee Leave Page
**File:** `src/app/dashboard/employee/leave/page.tsx`

**Changes:**
- ✅ Uses `LeaveStatusBadge` component
- ✅ Shows PROCESSING status correctly
- ✅ Tooltip shows status description

**Before:**
```tsx
<Badge variant={statusVariant[leave.status]}>
  {leave.status}
</Badge>
```

**After:**
```tsx
<LeaveStatusBadge status={leave.status} />
```

### Manager Pending Approvals
**File:** `pending-approvals-tab.tsx`

**Changes:**
- ✅ Enhanced error messages with descriptions
- ✅ HTTP status code-based error handling
- ✅ Success messages mention PROCESSING status
- ✅ Reporting manager validation errors

### Admin Leave Approvals (HR)
**File:** `leave-approvals-tab.tsx`

**Changes:**
- ✅ Updated description to clarify PROCESSING workflow
- ✅ Enhanced error handling for status validation
- ✅ Success messages mention balance deduction
- ✅ Clear messaging about Step 2 role

### Amendment Approvals
**File:** `amendment-approvals-tab.tsx`

**Changes:**
- ✅ Enhanced error messages
- ✅ Permission-based error handling
- ✅ Success messages with balance adjustment info

---

## 🔄 Workflow Visualization

### Two-Step Approval Process

```
┌─────────────────────────────────────────────────────────────┐
│ Employee: Apply Leave                                       │
│ Status: PENDING                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│ Line Manager: Approve/Reject (Step 1)                      │
│ - Only assigned reporting manager can approve              │
│ - If approved: Status → PROCESSING                         │
│ - If rejected: Status → REJECTED (end)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v (if approved)
┌─────────────────────────────────────────────────────────────┐
│ HR Manager: Approve/Reject (Step 2)                        │
│ - Can only approve PROCESSING status                       │
│ - If approved: Status → APPROVED, balance deducted         │
│ - If rejected: Status → REJECTED                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Employee Leave Page
- [ ] Apply for leave - shows PENDING status
- [ ] View approved leave - shows APPROVED status
- [ ] View processing leave - shows PROCESSING status with tooltip
- [ ] Tooltip displays correct status description

### Line Manager Dashboard
- [ ] View pending leaves (PENDING status only)
- [ ] Approve leave - success message mentions PROCESSING
- [ ] Try to approve non-subordinate leave - see 403 error
- [ ] View approved leaves (PROCESSING status only)
- [ ] Reject leave - success message shown

### HR Dashboard
- [ ] View leaves in PROCESSING status only
- [ ] Approve PROCESSING leave - success message, status → APPROVED
- [ ] Try to approve PENDING leave - see 400 error
- [ ] Reject leave - success message shown

### Amendment Approvals
- [ ] View pending amendments (PENDING/PROCESSING)
- [ ] Approve amendment - success message
- [ ] Reject amendment - success message
- [ ] Error scenarios display properly

---

## 🐛 Common Issues & Solutions

### Issue 1: Status Not Showing Correctly
**Symptom:** Leave status shows as string instead of badge  
**Solution:** Import and use `LeaveStatusBadge` component

```tsx
import { LeaveStatusBadge } from '@/components/leave/leave-status-badge';

<LeaveStatusBadge status={leave.status} />
```

### Issue 2: Tooltip Not Working
**Symptom:** Badge shows but no tooltip on hover  
**Solution:** Ensure Tooltip component is installed

```bash
npx shadcn-ui@latest add tooltip
```

### Issue 3: Error Messages Not Showing
**Symptom:** Generic error instead of specific message  
**Solution:** Check error response structure

```typescript
const errorMessage = error?.response?.data?.message || error?.message;
const statusCode = error?.response?.status;
```

### Issue 4: Manager Can't Approve
**Symptom:** 403 error when manager tries to approve  
**Solution:** Verify user is assigned as reporting manager in backend

```sql
-- Check reporting manager assignment
SELECT e.*, rm.id as manager_employee_id 
FROM "Employee" e 
LEFT JOIN "Employee" rm ON e."reportingManagerId" = rm.id
WHERE e.id = 'employee-id';
```

---

## 📚 API Integration Reference

### Existing API Functions (Already Connected)
**File:** `src/lib/api/leave.ts`

✅ **Manager Endpoints:**
```typescript
getPendingLeavesForManager()        // GET /leave/manager/pending
getApprovedByManagerPendingHR()     // GET /leave/manager/approved-pending-hr
approveLeave(id)                    // PATCH /leave/:id/approve
rejectLeave(id)                     // PATCH /leave/:id/reject
```

✅ **Admin/HR Endpoints:**
```typescript
getPendingHRApprovals()             // GET /leave/manager/approved-pending-hr
approveLeave(id)                    // PATCH /leave/:id/approve (HR Step 2)
rejectLeave(id)                     // PATCH /leave/:id/reject
```

✅ **Amendment Endpoints:**
```typescript
listAmendments()                    // GET /leave/amendment
approveAmendment(id)                // PATCH /leave/amendment/:id/approve
rejectAmendment(id)                 // PATCH /leave/amendment/:id/reject
```

### React Query Hooks
**File:** `src/lib/queries/leave.ts`

✅ **All hooks already implemented:**
```typescript
// Manager hooks
useManagerPendingLeaves()
useManagerApprovedLeaves()
useManagerApproveLeave()
useManagerRejectLeave()

// Admin/HR hooks
usePendingHRApprovals()
useApproveLeave()
useRejectLeave()

// Amendment hooks
useAmendments()
useApproveAmendment()
useRejectAmendment()
```

---

## 🎨 UI/UX Improvements

### Status Badge Colors
- **PENDING** → Outline (gray border)
- **PROCESSING** → Secondary (blue/gray)
- **APPROVED** → Default (green)
- **REJECTED** → Destructive (red)
- **HOLD** → Outline (gray)
- **CANCELLED** → Destructive (red)

### User-Friendly Labels
- **PENDING** → "Pending"
- **PROCESSING** → "In Progress"
- **APPROVED** → "Approved"
- **REJECTED** → "Rejected"
- **HOLD** → "On Hold"
- **CANCELLED** → "Cancelled"

### Contextual Descriptions
Each status has a tooltip explaining:
- What the status means
- What step it's at in the workflow
- What happens next

---

## 📖 Developer Guide

### Adding Status Badge to New Components

1. **Import the component:**
```tsx
import { LeaveStatusBadge } from '@/components/leave/leave-status-badge';
```

2. **Use in JSX:**
```tsx
<LeaveStatusBadge status={leave.status} showTooltip={true} />
```

3. **Optional props:**
- `status` (required): The leave status string
- `showTooltip` (optional): Show tooltip on hover (default: true)

### Using Status Helper Functions

```typescript
import {
  getStatusLabel,
  getStatusVariant,
  getStatusDescription,
  canManagerApprove,
  canHRApprove
} from '@/lib/types/leave';

// Check if manager can approve
if (canManagerApprove(leave.status)) {
  // Show approve button
}

// Check if HR can approve
if (canHRApprove(leave.status)) {
  // Show HR approve button
}

// Get user-friendly label
const label = getStatusLabel(leave.status);

// Get badge variant
const variant = getStatusVariant(leave.status);

// Get description for tooltip
const description = getStatusDescription(leave.status);
```

### Error Handling Pattern

```typescript
const handleAction = async (id: string) => {
  try {
    await mutation.mutateAsync(id);
    toast.success("Action successful", {
      description: "Additional context about what happened"
    });
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message;
    const errorString = typeof errorMessage === 'string' 
      ? errorMessage 
      : String(errorMessage);
    
    // Handle specific status codes
    if (error?.response?.status === 403) {
      toast.error("Permission Denied", {
        description: errorString
      });
    } else if (error?.response?.status === 400) {
      toast.error("Invalid Request", {
        description: errorString
      });
    } else {
      toast.error("Action Failed", {
        description: errorString
      });
    }
  }
};
```

---

## 🚀 Deployment Notes

### Prerequisites
- Backend v2.0 deployed with PROCESSING status support
- All manager endpoints available
- Reporting manager relationships configured in database

### Deployment Steps
1. ✅ Deploy backend v2.0 first
2. ✅ Deploy frontend changes
3. ✅ Verify status flow works end-to-end
4. ✅ Test error scenarios
5. ✅ Monitor for any issues

### Rollback Plan
If issues occur:
1. Frontend is backward compatible
2. PROCESSING status will show correctly even if not in old frontend
3. Manager endpoints are new, no breaking changes

---

## 📊 Performance Considerations

### Status Badge Component
- Lightweight component
- Uses Radix UI Tooltip (optimized)
- No API calls
- Fast render time

### Error Handling
- No performance impact
- Better UX with specific messages
- Helps reduce support tickets

### API Calls
- No new API calls added
- Uses existing React Query hooks
- Proper cache invalidation
- Refetch intervals already optimized (30s)

---

## 🔐 Security Notes

### Reporting Manager Validation
- Backend enforces reporting manager checks
- Frontend shows user-friendly errors
- No security bypass possible from frontend

### Role-Based Access
- HR can only approve PROCESSING status
- Managers can only approve PENDING status
- Backend enforces all permissions

---

## ✅ Completion Checklist

- [x] Created leave types file with status enums
- [x] Created status badge component
- [x] Updated employee leave page
- [x] Enhanced manager approval error handling
- [x] Enhanced HR approval error handling
- [x] Enhanced amendment approval error handling
- [x] Added success messages with context
- [x] Added status descriptions
- [x] Created comprehensive documentation
- [ ] Tested employee leave application flow
- [ ] Tested manager approval workflow
- [ ] Tested HR approval workflow
- [ ] Tested amendment workflow
- [ ] Verified error scenarios

---

## 📞 Support

### Common Questions

**Q: Why can't I approve a leave as a manager?**  
A: You must be assigned as the employee's reporting manager in the system. Check with HR to verify the reporting relationship.

**Q: Why can't HR approve a PENDING leave?**  
A: HR can only approve leaves with PROCESSING status (Step 2). The leave must be approved by the Line Manager first (Step 1).

**Q: What does PROCESSING status mean?**  
A: PROCESSING means the leave has been approved by the Line Manager (Step 1) and is now waiting for HR approval (Step 2).

**Q: When is the balance deducted?**  
A: Balance is only deducted when HR gives final approval (Step 2), changing the status from PROCESSING to APPROVED.

---

**Version:** 2.0.0  
**Last Updated:** December 14, 2024  
**Status:** ✅ Complete and Ready for Testing
