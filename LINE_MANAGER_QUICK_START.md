# Line Manager Assignment System - Quick Start Guide

## 🎯 Overview

A complete line manager assignment feature for the HRMS frontend, allowing admins to manage employee reporting relationships through an intuitive UI.

## 📍 Where to Access

### 1. Employee Detail Page
**URL:** `/dashboard/admin/employees/[id]`

- Button in profile card header
- Shows current manager
- Click "Assign Manager" or "Change Manager"

### 2. Line Manager Dashboard
**URL:** `/dashboard/admin/line-managers`

- Centralized management view
- Statistics dashboard
- Search and bulk management
- Table with all employees

### 3. Navigation Menu
Look for **"Line Managers"** with UserCog icon in the admin sidebar menu.

## 🚀 Quick Usage

### Assign a Manager

```
1. Open employee detail page or line managers dashboard
2. Click "Assign Manager" button
3. Search for manager in the dialog (by name or code)
4. Click on a manager to select
5. Click "Assign Manager" to confirm
6. Toast notification confirms success
```

### Change a Manager

```
1. Open AssignManagerDialog for employee
2. Current manager is shown at top
3. Select a new manager from the list
4. Click "Assign Manager"
5. Previous manager info shown in toast
```

### Remove a Manager

```
1. Open AssignManagerDialog for employee
2. Click X button next to current manager
3. Confirm removal
4. Manager is removed
```

## 🔑 Key Components

### AssignManagerDialog

**Location:** `/src/components/assign-manager-dialog.tsx`

**Props:**
```typescript
{
  employeeId: string;           // Employee UUID
  employeeName: string;         // Display name
  currentManager?: object;      // Current manager data
  onSuccess?: () => void;       // Callback on success
}
```

**Example:**
```tsx
<AssignManagerDialog
  employeeId="uuid-here"
  employeeName="John Doe"
  currentManager={employee.reportingManager}
/>
```

### Line Manager Dashboard

**Location:** `/src/app/dashboard/admin/line-managers/page.tsx`

**Features:**
- Statistics cards
- Search functionality
- Employee table with actions
- Shows assigned/unassigned status

## 🔌 API Details

### Endpoint
```
PATCH /employees/:id/manager
```

### Request Body
```typescript
{
  reportingManagerId: string | null,  // Manager ID or null to remove
  skipRoleValidation?: boolean,       // Optional
  requireSameDepartment?: boolean     // Optional
}
```

### Response
```typescript
{
  message: "Manager assigned successfully",
  employee: { /* full employee object */ },
  previousManager: {
    id: "uuid",
    firstName: "Jane",
    lastName: "Doe"
  }
}
```

## 🎨 Features

✅ **Search & Filter** - Find managers quickly by name or code  
✅ **Self-Assignment Prevention** - Automatic filtering  
✅ **Real-time Validation** - Instant feedback  
✅ **Loading States** - Clear progress indicators  
✅ **Error Handling** - Descriptive error messages  
✅ **Toast Notifications** - Success/error feedback  
✅ **Responsive Design** - Mobile-friendly  
✅ **Accessibility** - Keyboard navigation, screen readers  

## 🔒 Authorization

**Required Role:** ADMIN, HR_MANAGER, or DEPARTMENT_HEAD

- Frontend: Only shown in admin routes
- Backend: Authorization enforced on API

## 🐛 Common Issues

### Dialog Doesn't Open
- Ensure button is properly wrapped with DialogTrigger
- Check Dialog component is imported correctly

### No Managers in List
- Verify managers have appropriate roles (TEAM_LEAD, DEPARTMENT_HEAD, etc.)
- Check API endpoint `/employees` is working
- Look for console errors

### Assignment Fails
- Verify user has ADMIN role
- Check authentication token is valid
- Review backend logs for errors
- Common errors: circular reference, self-assignment, unauthorized

### UI Doesn't Update
- Check React Query cache invalidation
- Verify employee ID is correct
- Look for console errors

## 📝 Testing Checklist

- [ ] Assign new manager
- [ ] Change existing manager
- [ ] Remove manager
- [ ] Search for managers
- [ ] Try to assign same manager (should work, idempotent)
- [ ] Check error handling (network failure)
- [ ] Verify toast notifications
- [ ] Test on mobile device
- [ ] Check accessibility (keyboard navigation)
- [ ] Verify only admins can access

## 📚 Documentation

- **Full Guide:** `/frontend/FRONTEND_LINE_MANAGER_IMPLEMENTATION.md`
- **Summary:** `/frontend/FRONTEND_IMPLEMENTATION_SUMMARY.md`
- **Backend Docs:** `/backend/src/employee/LINE_MANAGER_FEATURE.md`

## 🛠️ Development

### Running Locally

```bash
cd frontend
pnpm install
pnpm dev
```

Open: http://localhost:3000

### File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── dialog.tsx              ← Dialog component
│   │   └── assign-manager-dialog.tsx   ← Main component
│   ├── app/
│   │   └── dashboard/
│   │       └── admin/
│   │           ├── employees/[id]/page.tsx  ← Detail integration
│   │           └── line-managers/page.tsx   ← Dashboard
│   ├── lib/
│   │   ├── api/
│   │   │   └── employees.ts           ← API functions
│   │   └── queries/
│   │       └── employees.ts           ← React Query hooks
│   └── modules/
│       └── shared/
│           └── config/
│               └── navigation.ts       ← Menu config
└── docs/
    ├── FRONTEND_LINE_MANAGER_IMPLEMENTATION.md
    └── FRONTEND_IMPLEMENTATION_SUMMARY.md
```

## 📞 Need Help?

1. Check documentation files
2. Review browser console for errors
3. Check backend API is running
4. Verify authentication
5. Contact development team

## 🎉 Quick Demo

1. **Login** as admin
2. **Navigate** to `/dashboard/admin/line-managers`
3. **See** statistics and employee list
4. **Click** "Assign Manager" on any employee
5. **Search** and select a manager
6. **Confirm** and see success toast!

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** December 12, 2025
