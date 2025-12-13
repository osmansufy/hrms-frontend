# Admin Leave Management Feature - Implementation Guide

## 📋 Overview

A comprehensive leave management system has been implemented for admin users in the HRMS frontend. This feature allows administrators and HR managers to manage all aspects of the leave system including approvals, policies, accrual rules, and amendments.

## ✨ Features Implemented

### 1. **Leave Approvals (Step 2 - HR)**
- View leaves with `PROCESSING` status (approved by line managers)
- Approve or reject leave requests at Step 2 (HR level)
- Real-time updates with 30-second polling
- Detailed leave information with employee details
- Confirmation dialogs before approval/rejection
- Automatic balance deduction on approval

### 2. **Amendment Approvals**
- Review amendment requests (AMEND or CANCEL)
- View original vs new dates side-by-side
- Approve/reject amendment requests
- Automatic balance adjustments on approval
- Support for cancellation requests

### 3. **Leave Policy Management**
- Create policies for leave types
- Configure maximum days allowed
- Set carry forward limits
- Enable/disable encashment
- Allow/disallow advance leave
- Set document requirement thresholds
- View all configured policies in a table

### 4. **Accrual Rules Management**
- Create accrual rules for automatic leave balance updates
- Configure accrual frequency (Weekly, Monthly, Quarterly, Yearly)
- Set rate per period (e.g., 1.5 days per month)
- Choose accrual strategy (Fixed or Tenure-based)
- Enable proration
- Set probation period before accrual starts
- Configure balance reset day

## 🗂️ File Structure

```
frontend/src/
├── app/dashboard/admin/leave/
│   ├── page.tsx                           # Main page with tabs
│   └── components/
│       ├── index.ts                       # Component exports
│       ├── leave-approvals-tab.tsx        # Leave approvals UI
│       ├── amendment-approvals-tab.tsx    # Amendment approvals UI
│       ├── leave-policies-tab.tsx         # Policy management UI
│       └── accrual-rules-tab.tsx          # Accrual rules UI
├── lib/
│   ├── api/leave.ts                       # Extended with admin endpoints
│   └── queries/leave.ts                   # Extended with admin hooks
└── modules/shared/config/navigation.ts    # Added "Leave Management" link
```

## 🔌 API Integration

### New API Functions Added

**Leave Approvals:**
- `approveLeave(id)` - Approve leave at Step 2
- `rejectLeave(id)` - Reject leave at Step 2
- `getPendingHRApprovals()` - Get leaves in PROCESSING status

**Amendment Management:**
- `approveAmendment(id)` - Approve amendment
- `rejectAmendment(id)` - Reject amendment
- `listAmendments()` - List all amendments
- `getAmendment(id)` - Get amendment details

**Policy Management:**
- `createLeavePolicy(payload)` - Create new policy
- `getLeavePolicy(leaveTypeId)` - Get policy details
- `updateLeavePolicy(leaveTypeId, payload)` - Update policy
- `addNoticeRule(policyId, payload)` - Add notice rule

**Accrual Rules:**
- `createAccrualRule(payload)` - Create accrual rule
- `listAccrualRules()` - List all rules
- `getAccrualRule(id)` - Get rule details
- `updateAccrualRule(id, payload)` - Update rule

### React Query Hooks

**Admin Leave Hooks:**
- `usePendingHRApprovals()` - Fetch pending HR approvals
- `useApproveLeave()` - Mutation for approving leaves
- `useRejectLeave()` - Mutation for rejecting leaves
- `useAmendments()` - Fetch all amendments
- `useApproveAmendment()` - Mutation for approving amendments
- `useRejectAmendment()` - Mutation for rejecting amendments
- `useLeavePolicy(leaveTypeId)` - Fetch policy by leave type
- `useCreateLeavePolicy()` - Mutation for creating policy
- `useUpdateLeavePolicy(leaveTypeId)` - Mutation for updating policy
- `useAccrualRules()` - Fetch all accrual rules
- `useCreateAccrualRule()` - Mutation for creating rule
- `useUpdateAccrualRule(id)` - Mutation for updating rule

## 🎨 UI Components

### Tab-based Layout
The main page uses a tab interface with 4 sections:
1. **Approvals** - HR-level leave approvals
2. **Amendments** - Amendment request approvals
3. **Policies** - Leave policy configuration
4. **Accrual Rules** - Accrual rule management

### Key UI Features
- ✅ Responsive tables with sorting
- ✅ Badge indicators for status
- ✅ Modal dialogs for creating policies/rules
- ✅ Confirmation dialogs for critical actions
- ✅ Loading states with spinners
- ✅ Empty states with helpful messages
- ✅ Toast notifications for success/error feedback
- ✅ Real-time data updates (30-second polling for approvals)

## 🔐 Access Control

**Required Permissions:**
- `leave.approve` - Access to leave management page
- Admin or HR_MANAGER role required

**Navigation:**
- Added "Leave Management" menu item in admin sidebar
- Located under `/dashboard/admin/leave`
- Icon: CalendarCheck from lucide-react

## 📝 Usage Guide

### For HR Managers

#### Approving Leaves (Step 2)
1. Navigate to **Admin** → **Leave Management**
2. Go to **Approvals** tab
3. Review leaves with `PROCESSING` status
4. Click **Approve** or **Reject** button
5. Confirm action in dialog
6. Leave status updated and employee notified

#### Managing Amendments
1. Go to **Amendments** tab
2. View pending amendment requests
3. Review original vs new dates
4. Approve or reject amendments
5. Balance automatically adjusted on approval

#### Creating Leave Policies
1. Go to **Policies** tab
2. Click **Create Policy** button
3. Select leave type (only types without policies shown)
4. Configure settings:
   - Maximum days allowed
   - Carry forward limit
   - Document threshold
   - Encashment flag
   - Advance leave flag
5. Click **Create Policy**
6. Policy applied to all employees

#### Setting Up Accrual Rules
1. Go to **Accrual Rules** tab
2. Click **Create Rule** button
3. Configure accrual settings:
   - Frequency (Weekly/Monthly/Quarterly/Yearly)
   - Days per period (e.g., 1.5)
   - Strategy (Fixed/Tenure-based)
   - Proration option
   - Probation period
   - Reset day
4. Click **Create Rule**
5. Rule can be linked to leave policies

## 🔄 Workflow Integration

### Leave Approval Workflow
```
Step 1: Line Manager Approval
  ↓ (Status: PENDING → PROCESSING)
Step 2: HR Manager Approval ← YOU ARE HERE
  ↓ (Status: PROCESSING → APPROVED)
Balance Deducted, Employee Notified
```

### Amendment Workflow
```
Employee Creates Amendment
  ↓
Line Manager Reviews (Step 1)
  ↓
HR Manager Reviews (Step 2) ← YOU ARE HERE
  ↓
Leave Updated, Balance Adjusted
```

## 🚀 Getting Started

### Prerequisites
- Backend API running on configured endpoint
- User with ADMIN or HR_MANAGER role
- Valid JWT authentication token

### First-Time Setup
1. **Create Leave Types** (if not exists)
   - Navigate to leave types management
   - Create types: Annual, Sick, Casual, etc.

2. **Create Accrual Rules**
   - Go to Accrual Rules tab
   - Create rules for automatic balance updates

3. **Create Leave Policies**
   - Go to Policies tab
   - Create policy for each leave type
   - Link accrual rules to policies

4. **Start Approving**
   - Monitor Approvals tab for pending requests
   - Process amendments as they come

## 🧪 Testing Checklist

- [ ] Can view pending HR approvals
- [ ] Can approve leave (balance deducted)
- [ ] Can reject leave
- [ ] Can view pending amendments
- [ ] Can approve AMEND amendment
- [ ] Can approve CANCEL amendment
- [ ] Can reject amendments
- [ ] Can create leave policy
- [ ] Can view all policies
- [ ] Can create accrual rule
- [ ] Can view all accrual rules
- [ ] Navigation menu shows "Leave Management"
- [ ] Proper access control (admin/HR only)
- [ ] Toast notifications work
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Real-time polling works (30s interval)

## 📊 Data Models

### LeaveWithApprovals
```typescript
{
  id: string;
  userId: string;
  leaveTypeId: string;
  reason: string;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
  startDate: string;
  endDate: string;
  approvals?: LeaveApproval[];
  user?: {
    email: string;
    employee?: {
      firstName: string;
      lastName: string;
    };
  };
}
```

### LeaveAmendment
```typescript
{
  id: string;
  originalLeaveId: string;
  changeType: "AMEND" | "CANCEL";
  newStartDate?: string;
  newEndDate?: string;
  reason: string;
  status: string;
  createdBy?: {
    email: string;
    employee?: {
      firstName: string;
      lastName: string;
    };
  };
}
```

### LeavePolicy
```typescript
{
  id: string;
  leaveTypeId: string;
  maxDays?: number;
  encashmentFlag: boolean;
  carryForwardCap?: number;
  allowAdvance: boolean;
  requireDocThresholdDays?: number;
  noticeRules?: LeaveNoticeRule[];
  accrualRule?: LeaveAccrualRule;
}
```

### LeaveAccrualRule
```typescript
{
  id: string;
  frequency: "WEEKLY" | "SEMI_MONTHLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  ratePerPeriod: number;
  accrualStrategy: "FIXED" | "TENURE_BASED";
  prorateFlag: boolean;
  startAfterDays?: number;
  resetMonthDay?: number;
}
```

## 🐛 Troubleshooting

### Issue: Approvals not showing
- **Check:** Ensure leaves have `PROCESSING` status
- **Check:** Line manager must have approved (Step 1)
- **Check:** API endpoint `/leave/manager/approved-pending-hr` is accessible

### Issue: Can't create policy
- **Check:** Leave type doesn't already have a policy
- **Check:** All required fields are filled
- **Check:** User has ADMIN or HR_MANAGER role

### Issue: Balance not deducted after approval
- **Check:** Approval was at Step 2 (HR level)
- **Check:** Backend processed approval successfully
- **Check:** Leave balance record exists for user

## 🔮 Future Enhancements

- [ ] Bulk approval functionality
- [ ] Comment/notes on approvals
- [ ] Approval history view
- [ ] Advanced filtering and search
- [ ] Export to Excel/PDF
- [ ] Email notifications
- [ ] Dashboard analytics
- [ ] Notice rule management UI
- [ ] Policy versioning
- [ ] Audit trail

## 📚 Related Documentation

- [Leave Management API Documentation](../../../backend/LEAVE_MANAGEMENT_API_DOCUMENTATION.md)
- [Leave Management System](../../../backend/LEAVE_MANAGEMENT_SYSTEM.md)
- [Leave System Implementation Summary](../../../backend/LEAVE_SYSTEM_IMPLEMENTATION_SUMMARY.md)

## 👥 Support

For questions or issues:
1. Check backend API documentation
2. Verify user permissions
3. Review browser console for errors
4. Check network tab for API responses

---

**Status:** ✅ **COMPLETED**  
**Version:** 1.0.0  
**Last Updated:** December 2024  
**Author:** HRMS Development Team
