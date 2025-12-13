# Line Manager Assignment System - Frontend

## Overview

Complete frontend implementation for managing employee reporting relationships (line managers) in the HRMS system. This feature allows admins to assign, update, and remove line managers for employees through an intuitive UI.

## Features

### 1. **AssignManagerDialog Component**
A reusable dialog component for manager assignment operations.

**Location:** `/src/components/assign-manager-dialog.tsx`

**Features:**
- 🔍 Search and filter managers by name or employee code
- ✅ Select from a list of eligible managers (only users with managerial roles)
- 🔄 Update existing manager assignments
- ❌ Remove current manager
- 📊 Real-time validation and feedback
- 🎯 Prevents self-assignment (employee cannot be their own manager)

**Usage:**
```tsx
import { AssignManagerDialog } from "@/components/assign-manager-dialog";

<AssignManagerDialog
  employeeId="employee-uuid"
  employeeName="John Doe"
  currentManager={employee.reportingManager}
  onSuccess={() => console.log("Manager assigned!")}
/>
```

### 2. **Employee Detail Page Integration**
Enhanced employee detail page with inline manager assignment.

**Location:** `/src/app/dashboard/admin/employees/[id]/page.tsx`

**Features:**
- Quick access button in the profile card header
- Shows current manager information
- One-click manager assignment/change

### 3. **Line Manager Management Dashboard**
Dedicated page for centralized manager assignment management.

**Location:** `/src/app/dashboard/admin/line-managers/page.tsx`

**Features:**
- 📊 **Statistics Dashboard:**
  - Total employees count
  - Employees with assigned managers
  - Employees without managers (requires attention)
  
- 📋 **Employee Table:**
  - Comprehensive employee list
  - Manager assignment status
  - Quick assign/change actions
  - Search and filter functionality
  
- 🎯 **Priority View:**
  - Employees without managers shown first
  - Easy identification of unassigned employees

## API Integration

### API Client (`/src/lib/api/employees.ts`)

**New Functions:**

```typescript
// Assign or update manager
export async function assignManager(
  employeeId: string,
  payload: AssignManagerPayload
): Promise<AssignManagerResponse>

// Payload type
type AssignManagerPayload = {
  reportingManagerId: string | null;  // null to remove manager
  skipRoleValidation?: boolean;       // Skip manager role validation
  requireSameDepartment?: boolean;    // Require same department
}

// Response type
type AssignManagerResponse = {
  message: string;
  employee: ApiEmployee;
  previousManager?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}
```

### React Query Hooks (`/src/lib/queries/employees.ts`)

**New Hooks:**

```typescript
// Hook for manager assignment mutation
const assignMutation = useAssignManager(employeeId);

// Usage
await assignMutation.mutateAsync({
  reportingManagerId: "manager-uuid",
  skipRoleValidation: false,
  requireSameDepartment: false,
});
```

**Features:**
- Automatic cache invalidation
- Optimistic updates for instant UI feedback
- Error handling with detailed messages
- Loading states for better UX

## UI Components

### Dialog Component (`/src/components/ui/dialog.tsx`)
New shadcn/ui dialog component added for modal functionality.

**Exports:**
- `Dialog` - Root component
- `DialogTrigger` - Button to open dialog
- `DialogContent` - Modal content container
- `DialogHeader` - Header section
- `DialogTitle` - Title text
- `DialogDescription` - Description text
- `DialogFooter` - Footer with actions

## User Flow

### Assigning a Manager

1. **From Employee Detail Page:**
   ```
   1. Navigate to employee detail page
   2. Click "Assign Manager" or "Change Manager" button
   3. Search for a manager in the dialog
   4. Select from the list
   5. Click "Assign Manager"
   6. Confirmation toast appears
   ```

2. **From Line Manager Dashboard:**
   ```
   1. Navigate to /dashboard/admin/line-managers
   2. Find employee in the table
   3. Click "Assign Manager" button in the Actions column
   4. Follow same dialog flow
   ```

### Removing a Manager

```
1. Open AssignManagerDialog for the employee
2. Click the X button next to current manager
3. Confirm the removal action
4. Manager is removed and toast confirmation appears
```

## Access Control

**Admin Only Feature** - This feature is restricted to users with ADMIN role.

**Backend Authorization:**
- ADMIN - Full access to all employees
- HR_MANAGER - Full access to all employees
- DEPARTMENT_HEAD - Can only manage employees in their department

**Frontend Display:**
- Only shown in admin routes (`/dashboard/admin/*`)
- Dialog requires authentication token
- API calls fail gracefully with error messages for unauthorized users

## Error Handling

### Common Errors and Messages

| Error | Message | Action |
|-------|---------|--------|
| Circular reference | "Circular reference detected" | Choose a different manager |
| Self-assignment | "Employee cannot be their own manager" | Select a different manager |
| Invalid manager role | "Selected manager doesn't have required role" | Enable "Skip role validation" or select different manager |
| Department mismatch | "Manager and employee must be in same department" | Disable "Require same department" or select different manager |
| Unauthorized | "Insufficient permissions" | Contact admin |
| Network error | "Failed to assign manager" | Check connection and retry |

### Error Display

- **Toast Notifications:** Primary feedback mechanism
- **Inline Validation:** Real-time checks before submission
- **Descriptive Messages:** Clear explanation of what went wrong
- **Previous Manager Info:** Shows who was replaced on successful update

## Data Flow

```
User Action
    ↓
AssignManagerDialog
    ↓
useAssignManager hook
    ↓
assignManager API function
    ↓
Backend API: PATCH /employees/:id/manager
    ↓
Response with updated employee data
    ↓
React Query cache update
    ↓
UI automatically refreshes
```

## Validation Rules

### Frontend Validation

1. **Manager Selection:** Must select a manager (not empty)
2. **Self-Assignment:** Prevented by filtering employee from manager list
3. **Loading State:** Buttons disabled during API call

### Backend Validation (Handled by API)

1. **Circular Reference:** Prevents manager loops (A→B→C→A)
2. **Role Validation:** Manager must have appropriate role (optional)
3. **Department Alignment:** Same department check (optional)
4. **Authorization:** User must have permission to assign managers

## Styling and UX

### Design Patterns

- **Consistent Buttons:** "Assign Manager" / "Change Manager" based on current state
- **Badge Indicators:** Visual status for assigned/unassigned
- **Search Functionality:** Quick filtering of large manager lists
- **Responsive Layout:** Mobile-friendly dialog and table
- **Loading States:** Clear feedback during async operations

### Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader friendly labels
- ✅ Focus management in dialogs
- ✅ Clear action buttons
- ✅ Descriptive error messages

## Testing Recommendations

### Manual Testing Checklist

- [ ] Assign a new manager to an employee
- [ ] Change an existing manager
- [ ] Remove a manager
- [ ] Search for managers in the dialog
- [ ] Try to assign the same manager (should show no change)
- [ ] Verify toast notifications appear
- [ ] Check that employee detail page updates
- [ ] Test with different user roles (ADMIN only should work)
- [ ] Verify circular reference prevention
- [ ] Test error scenarios (network failure, invalid IDs)

### Component Testing

```typescript
// Example test structure
describe("AssignManagerDialog", () => {
  it("renders with current manager", () => {});
  it("allows searching for managers", () => {});
  it("prevents self-assignment", () => {});
  it("handles assignment success", () => {});
  it("handles assignment errors", () => {});
  it("allows removing current manager", () => {});
});
```

## Performance Considerations

1. **Query Caching:** Manager list cached for 30 seconds
2. **Optimistic Updates:** UI updates immediately on success
3. **Debounced Search:** Prevents excessive API calls while typing
4. **Lazy Loading:** Dialog content loaded only when opened

## Troubleshooting

### Dialog doesn't open
- Check if button is properly wrapped with `DialogTrigger`
- Verify Dialog component is properly installed

### Managers list is empty
- Ensure backend returns users with managerial roles
- Check API endpoint `/employees` is accessible
- Verify role filtering logic in `useManagers` hook

### Assignment fails silently
- Check browser console for errors
- Verify API endpoint is correct: `PATCH /employees/:id/manager`
- Ensure user has ADMIN role
- Check authentication token is valid

### UI doesn't update after assignment
- Verify React Query cache invalidation is working
- Check `onSuccess` callback in mutation
- Ensure employee ID is correct

## Future Enhancements

- [ ] Bulk manager assignment for multiple employees
- [ ] Manager hierarchy visualization (org chart)
- [ ] Manager workload indicators (number of direct reports)
- [ ] Department-based manager suggestions
- [ ] Manager change history/audit log
- [ ] Email notifications on manager changes
- [ ] Export manager assignments report
- [ ] Advanced filters (by department, designation, etc.)

## Dependencies

```json
{
  "@radix-ui/react-dialog": "Dialog primitive component",
  "@tanstack/react-query": "State management and caching",
  "sonner": "Toast notifications",
  "lucide-react": "Icon library",
  "zod": "Schema validation",
  "react-hook-form": "Form management"
}
```

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/employees` | List all employees |
| GET | `/employees/:id` | Get employee details |
| PATCH | `/employees/:id/manager` | Assign/update/remove manager |

## Files Modified/Created

### Created Files
1. ✅ `/src/components/ui/dialog.tsx` - Dialog UI component
2. ✅ `/src/components/assign-manager-dialog.tsx` - Manager assignment dialog
3. ✅ `/src/app/dashboard/admin/line-managers/page.tsx` - Management dashboard
4. ✅ `/frontend/FRONTEND_LINE_MANAGER_IMPLEMENTATION.md` - This documentation

### Modified Files
1. ✅ `/src/lib/api/employees.ts` - Added assignManager API function
2. ✅ `/src/lib/queries/employees.ts` - Added useAssignManager hook
3. ✅ `/src/app/dashboard/admin/employees/[id]/page.tsx` - Integrated dialog

## Quick Start

### For Developers

1. **Install Dependencies** (if not already installed):
   ```bash
   cd frontend
   pnpm install
   ```

2. **Start Development Server:**
   ```bash
   pnpm dev
   ```

3. **Test the Feature:**
   - Navigate to: `http://localhost:3000/dashboard/admin/employees`
   - Click on any employee
   - Click "Assign Manager" button
   - Select a manager and assign

4. **Access Management Dashboard:**
   - Navigate to: `http://localhost:3000/dashboard/admin/line-managers`

### For Admins

1. **Login** with ADMIN credentials
2. **Navigate** to Employee Detail page or Line Manager Dashboard
3. **Click** "Assign Manager" button
4. **Search** for the desired manager
5. **Select** and confirm assignment

## Support

For issues or questions:
1. Check this documentation first
2. Review backend API documentation: `/backend/src/employee/LINE_MANAGER_FEATURE.md`
3. Check browser console for errors
4. Verify API is running and accessible
5. Contact development team

---

**Last Updated:** December 12, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
