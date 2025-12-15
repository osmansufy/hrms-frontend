# Leave Management v2.0 - Quick Reference

## 📋 Status Flow

```
PENDING     → Manager approves → PROCESSING  → HR approves → APPROVED
            ↓ Manager rejects                 ↓ HR rejects
          REJECTED                          REJECTED
```

## 🎨 Status Badge Usage

```tsx
import { LeaveStatusBadge } from '@/components/leave/leave-status-badge';

<LeaveStatusBadge status="PROCESSING" />
// Renders: "In Progress" badge with tooltip
```

## 🔧 Helper Functions

```typescript
import {
  getStatusLabel,
  getStatusVariant,
  getStatusDescription,
  canManagerApprove,
  canHRApprove
} from '@/lib/types/leave';

// Get user-friendly label
getStatusLabel('PROCESSING')      // "In Progress"

// Get badge color
getStatusVariant('APPROVED')      // "default" (green)

// Get description
getStatusDescription('PROCESSING') // "Approved by Line Manager..."

// Check permissions
canManagerApprove('PENDING')      // true
canHRApprove('PROCESSING')        // true
```

## 🚨 Error Handling Pattern

```typescript
try {
  await mutation.mutateAsync(id);
  toast.success("Action successful", {
    description: "What happened next"
  });
} catch (error: any) {
  const msg = error?.response?.data?.message || error?.message;
  const statusCode = error?.response?.status;
  
  if (statusCode === 403) {
    toast.error("Permission Denied", { description: msg });
  } else if (statusCode === 400) {
    toast.error("Invalid Request", { description: msg });
  } else {
    toast.error("Action Failed", { description: msg });
  }
}
```

## 📡 API Hooks

```typescript
// Manager
useManagerPendingLeaves()         // PENDING leaves from subordinates
useManagerApprovedLeaves()        // PROCESSING leaves (approved by me)
useManagerApproveLeave()          // Approve → PROCESSING
useManagerRejectLeave()           // Reject → REJECTED

// HR
usePendingHRApprovals()           // PROCESSING leaves (need HR approval)
useApproveLeave()                 // Approve → APPROVED (deduct balance)
useRejectLeave()                  // Reject → REJECTED

// Amendments
useAmendments()                   // All amendments
useApproveAmendment()             // Approve amendment
useRejectAmendment()              // Reject amendment
```

## ✅ Common Error Messages

### Manager Errors
- **403:** "You are not the assigned reporting manager"
- **400:** "Employee has no reporting manager assigned"

### HR Errors
- **400:** "Only PROCESSING leaves can be approved by HR"
- **403:** "Permission denied"

### Amendment Errors
- **403:** "You don't have permission to approve"
- **404:** "Amendment or leave not found"

## 📊 Status Colors

| Status | Variant | Color |
|--------|---------|-------|
| PENDING | outline | Gray |
| PROCESSING | secondary | Blue |
| APPROVED | default | Green |
| REJECTED | destructive | Red |
| HOLD | outline | Gray |
| CANCELLED | destructive | Red |

## 🧪 Testing Checklist

- [ ] Employee applies leave → PENDING
- [ ] Manager approves → PROCESSING
- [ ] HR approves → APPROVED
- [ ] Try wrong manager → 403 error
- [ ] Try HR on PENDING → 400 error
- [ ] Status badges show correctly
- [ ] Tooltips work
- [ ] Error messages clear

## 📁 Files Modified

**Created:**
- `src/lib/types/leave.ts`
- `src/components/leave/leave-status-badge.tsx`

**Updated:**
- `src/app/dashboard/employee/leave/page.tsx`
- `src/app/dashboard/employee/leave-manager/components/pending-approvals-tab.tsx`
- `src/app/dashboard/admin/leave/components/leave-approvals-tab.tsx`
- `src/app/dashboard/admin/leave/components/amendment-approvals-tab.tsx`

## 🔗 Documentation

- **Full docs:** `FRONTEND_LEAVE_V2_UPDATES.md`
- **Summary:** `FRONTEND_LEAVE_V2_SUMMARY.md`
- **This card:** `LEAVE_V2_QUICK_REFERENCE.md`

---

**v2.0.0** | Last updated: December 14, 2024
