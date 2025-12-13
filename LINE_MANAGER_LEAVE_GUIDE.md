# Line Manager Leave Management Feature - Implementation Guide

## 📋 Overview

A comprehensive leave management system for **employees who are also managers** (line managers). This allows managers to:
- Approve/reject leave requests from their direct reports (Step 1)
- Track leaves they've approved that are waiting for HR approval
- View team leave calendar with conflict detection
- Only their assigned reporting subordinates' leaves are visible

## ✨ Key Features

### 1. **Pending Approvals (Step 1)**
- View leave requests with `PENDING` status from direct reports
- Approve leave (moves to `PROCESSING` status for HR review)
- Reject leave (immediately sets to `REJECTED`)
- **Reporting Manager Validation**: Only the assigned reporting manager can approve
- Detailed employee information and leave details
- Real-time updates with 30-second polling

### 2. **Awaiting HR Approval**
- Track leaves you've approved with `PROCESSING` status
- Monitor workflow progress from Step 1 to Step 2
- See when you approved each request
- Understand that balance will be deducted after HR approval

### 3. **Team Leave Calendar**
- View all team members' leaves (past, present, future)
- **Conflict Detection**: Alerts when multiple team members have overlapping leaves
- Visual indicators for ongoing leaves
- Status badges for all leave states
- Helps with resource planning and approval decisions

## 🔐 Access Control & Reporting Manager Relationship

### Who Can Use This Feature?
- **Any employee who has subordinates** (employees with `reportingManagerId` pointing to them)
- No special role required (EMPLOYEE role is sufficient)
- Automatically accessible via "Team Leave" menu item

### Reporting Manager Validation
The system enforces that **only the assigned reporting manager** can approve leaves:

```typescript
// Backend validates on approval:
if (employee.reportingManager.user.id !== currentUser.id) {
  throw new ForbiddenException("You are not the reporting manager for this employee");
}
```

This ensures:
- ✅ Only correct manager can approve (Step 1)
- ✅ Prevents unauthorized approvals
- ✅ Maintains proper organizational hierarchy

### Dual Role Support
Users can be both EMPLOYEE and manager simultaneously:
- Apply for own leave as employee
- Approve team members' leaves as manager
- Distinct workflows for each role

## 🗂️ File Structure

```
frontend/src/
├── app/dashboard/employee/leave-manager/
│   ├── page.tsx                           # Main page with tabs & subordinate check
│   └── components/
│       ├── index.ts                       # Component exports
│       ├── pending-approvals-tab.tsx      # Pending leave approvals (Step 1)
│       ├── approved-leaves-tab.tsx        # Leaves awaiting HR (PROCESSING)
│       └── team-calendar-tab.tsx          # Full team leave calendar
├── lib/
│   ├── api/leave.ts                       # Added manager endpoints
│   └── queries/leave.ts                   # Added manager hooks
└── modules/shared/config/navigation.ts    # Added "Team Leave" menu
```

## 🔌 API Integration

### New API Endpoints

**Line Manager Endpoints:**
```typescript
// Get pending leaves from subordinates (PENDING status)
GET /leave/manager/pending

// Get leaves approved by manager, waiting for HR (PROCESSING status)
GET /leave/manager/approved-pending-hr

// Get all subordinates' leaves for calendar view
GET /leave/manager/subordinates

// Approve leave (Step 1) - Only if you're the reporting manager
PATCH /leave/:id/approve

// Reject leave (Step 1) - Only if you're the reporting manager
PATCH /leave/:id/reject
```

### API Functions Added

```typescript
// In lib/api/leave.ts
export async function getPendingLeavesForManager(): Promise<LeaveWithApprovals[]>
export async function getApprovedByManagerPendingHR(): Promise<LeaveWithApprovals[]>
export async function getSubordinatesLeaves(): Promise<LeaveWithApprovals[]>
```

### React Query Hooks

```typescript
// In lib/queries/leave.ts
useManagerPendingLeaves()       // Pending approvals (30s polling)
useManagerApprovedLeaves()      // Approved by you, awaiting HR (30s polling)
useSubordinatesLeaves()         // All team leaves (2 min stale time)
useManagerApproveLeave()        // Approve mutation (Step 1)
useManagerRejectLeave()         // Reject mutation (Step 1)
```

## 🎨 UI Components

### Tab Interface
Three tabs for different manager views:
1. **Pending Approvals** - Requires action from manager
2. **Awaiting HR** - Tracking leaves in progress
3. **Team Calendar** - Full visibility of team availability

### Key UI Features
- ✅ Responsive tables with employee details
- ✅ Status badges (PENDING, PROCESSING, APPROVED, REJECTED)
- ✅ Conflict warnings for overlapping leaves
- ✅ Visual indicators for ongoing leaves ("On Leave" badge)
- ✅ Confirmation dialogs with clear explanations
- ✅ Loading states and empty states
- ✅ Toast notifications for success/error feedback
- ✅ Real-time data updates
- ✅ "No subordinates" handling with helpful message

## 📝 Usage Guide

### For Line Managers

#### Accessing Team Leave Management
1. Navigate to **Employee Dashboard** → **Team Leave**
2. If you have subordinates, you'll see the management tabs
3. If you don't have subordinates, you'll see a helpful message

#### Approving Leave Requests (Step 1)
1. Go to **Pending Approvals** tab
2. Review leave requests from your team
3. Click **Approve** to forward to HR (Step 2)
   - Leave status changes: `PENDING` → `PROCESSING`
   - No balance deduction yet
   - HR must approve for final confirmation
4. Click **Reject** to deny the request
   - Leave status changes: `PENDING` → `REJECTED`
   - Employee is notified
   - Process ends here

**Important Notes:**
- You can only approve leaves for your direct reports (those with you as `reportingManagerId`)
- If you try to approve someone else's leave, you'll get an error
- Balance is NOT deducted at this step (only after HR approval)

#### Tracking Approved Leaves
1. Go to **Awaiting HR** tab
2. View leaves you've approved that are in `PROCESSING` status
3. See when you approved each request
4. Monitor until HR completes Step 2

#### Viewing Team Calendar
1. Go to **Team Calendar** tab
2. View all team members' leaves
3. **Conflict Warnings**: Red alert when multiple people have overlapping leaves
4. **Ongoing Leaves**: Blue highlight for employees currently on leave
5. Use this for:
   - Planning approval decisions
   - Resource allocation
   - Meeting scheduling
   - Workload distribution

## 🔄 Leave Approval Workflow

### Two-Step Approval Process

```
Employee Applies for Leave
  ↓ (Status: PENDING)
  
Step 1: Line Manager Approval ← YOU ARE HERE
  ├─ APPROVE → Status: PROCESSING → Goes to HR
  └─ REJECT → Status: REJECTED → Process ends
  
Step 2: HR Manager Approval
  ├─ APPROVE → Status: APPROVED → Balance deducted
  └─ REJECT → Status: REJECTED → Process ends
```

### Status Flow
- **PENDING**: Waiting for your approval (Step 1)
- **PROCESSING**: You approved, waiting for HR (Step 2)
- **APPROVED**: HR approved, balance deducted
- **REJECTED**: Rejected at any step

## 🚀 Getting Started

### For Employees Becoming Managers

When an employee is assigned subordinates:
1. **No special setup required** - Feature auto-activates
2. **"Team Leave" appears** in sidebar automatically
3. **Access immediately** to pending approvals
4. **Reporting Manager relationship** must be established in system

### Assigning Reporting Managers

In the backend/admin panel:
```typescript
// When creating/updating employee
{
  "reportingManagerId": "manager-employee-id",  // Critical field
  ...
}
```

This `reportingManagerId` determines:
- Who can approve the employee's leaves
- Which manager sees the employee's leave requests
- Leave approval authorization

## 🧪 Testing Checklist

**As a Line Manager:**
- [ ] Can access "Team Leave" page
- [ ] Can see pending leaves from subordinates
- [ ] Can approve leave (changes to PROCESSING)
- [ ] Can reject leave (changes to REJECTED)
- [ ] Cannot approve leaves for non-subordinates
- [ ] Can view approved leaves awaiting HR
- [ ] Can see team calendar with all leaves
- [ ] Conflict detection works for overlapping leaves
- [ ] "On Leave" badge shows for ongoing leaves
- [ ] Toast notifications work correctly
- [ ] Real-time polling updates data
- [ ] Empty states display correctly

**As Employee Without Subordinates:**
- [ ] "Team Leave" menu item appears
- [ ] Page shows "No Team Members Found" message
- [ ] Can return to dashboard

**API Validation:**
- [ ] Backend validates reporting manager relationship
- [ ] Error message clear when not authorized
- [ ] Only assigned manager can approve
- [ ] Multiple managers with subordinates work independently

## 📊 Data Models

### LeaveWithApprovals (Extended)
```typescript
{
  id: string;
  userId: string;
  leaveTypeId: string;
  reason: string;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
  startDate: string;
  endDate: string;
  createdAt: string;
  user?: {
    email: string;
    employee?: {
      firstName: string;
      lastName: string;
      reportingManagerId?: string; // Critical for validation
    };
  };
  approvals?: LeaveApproval[];
}
```

### LeaveApproval
```typescript
{
  id: string;
  leaveId: string;
  step: 1 | 2;  // 1 = Line Manager, 2 = HR
  approverId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comment?: string;
  actedAt?: string;
}
```

## 🐛 Troubleshooting

### Issue: "You are not the reporting manager" error
- **Cause:** Employee's `reportingManagerId` doesn't match your ID
- **Solution:** Contact HR to verify reporting structure
- **Check:** Ensure employee record has correct `reportingManagerId`

### Issue: No pending leaves showing
- **Check:** Do you have subordinates assigned to you?
- **Check:** Have your subordinates applied for leave?
- **Check:** Are leaves in `PENDING` status (not already processed)?
- **Check:** Backend endpoint `/leave/manager/pending` is accessible

### Issue: Cannot see team calendar
- **Check:** `GET /leave/manager/subordinates` endpoint works
- **Check:** You have proper authentication
- **Check:** Your employee record exists in system

### Issue: "No Team Members Found" message
- **Cause:** You don't have any employees with `reportingManagerId` pointing to you
- **Solution:** This is normal if you're not a manager
- **Action:** Contact HR if you should be managing people

## 🔒 Security Features

### Reporting Manager Validation
- ✅ Backend validates reporting relationship on every approval
- ✅ Prevents unauthorized approvals
- ✅ Clear error messages for unauthorized attempts
- ✅ Enforces organizational hierarchy

### Role-Based Access
- ✅ Line Manager features don't require special roles
- ✅ Based on organizational structure (subordinates)
- ✅ Separate from ADMIN/HR_MANAGER roles
- ✅ Can't see other managers' team leaves

### Data Isolation
- ✅ Managers only see their subordinates' leaves
- ✅ Cannot access leaves from other teams
- ✅ Cannot perform actions on non-subordinate leaves
- ✅ Backend enforces data boundaries

## 🔮 Future Enhancements

- [ ] Bulk approval for multiple leaves
- [ ] Add comments when approving/rejecting
- [ ] Email notifications to employees
- [ ] Push notifications for pending approvals
- [ ] Leave balance visibility for subordinates
- [ ] Approval history/audit trail
- [ ] Team availability dashboard
- [ ] Calendar integration (Google, Outlook)
- [ ] Leave request templates
- [ ] Delegation of approval authority

## 📚 Related Documentation

- [Admin Leave Management Guide](./ADMIN_LEAVE_MANAGEMENT_GUIDE.md)
- [Leave Management API Documentation](../../../backend/LEAVE_MANAGEMENT_API_DOCUMENTATION.md)
- [Leave Management System](../../../backend/LEAVE_MANAGEMENT_SYSTEM.md)

## 💡 Best Practices

### For Line Managers
1. **Review promptly**: Check pending approvals regularly
2. **Check calendar**: Review team calendar before approving overlapping leaves
3. **Monitor conflicts**: Pay attention to conflict warnings
4. **Communication**: Discuss with team members if denying requests
5. **Plan ahead**: Use team calendar for resource planning

### For Administrators
1. **Accurate reporting structure**: Ensure `reportingManagerId` is correct for all employees
2. **Manager training**: Train new managers on the approval process
3. **Regular audits**: Verify reporting relationships are up to date
4. **Clear policies**: Communicate two-step approval process to all employees

## 👥 Support

For questions or issues:
1. Check if `reportingManagerId` is correctly set
2. Verify user has subordinates assigned
3. Review browser console for API errors
4. Check network tab for endpoint responses
5. Contact system administrator for reporting structure issues

---

**Status:** ✅ **COMPLETED**  
**Version:** 1.0.0  
**Last Updated:** December 2024  
**Author:** HRMS Development Team
