# Leave Balance Feature - Complete Implementation Guide

## Overview

The Leave Balance feature allows employees to view their available leave balances for each leave type, and enables administrators to manage and adjust these balances. This document provides a comprehensive guide to the implementation.

## Table of Contents

1. [Architecture](#architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [User Flows](#user-flows)
5. [Testing Guide](#testing-guide)
6. [API Reference](#api-reference)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Leave Balance System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐        ┌──────────────────────┐   │
│  │   Employee View     │        │    Admin View        │   │
│  ├─────────────────────┤        ├──────────────────────┤   │
│  │ - View Balances     │        │ - View All Balances  │   │
│  │ - See Available Days│        │ - Adjust Balances    │   │
│  │ - Check Carry Fwd   │        │ - Initialize Balances│   │
│  └─────────────────────┘        └──────────────────────┘   │
│           │                              │                   │
│           └──────────────┬───────────────┘                   │
│                          │                                   │
│                  ┌───────▼────────┐                         │
│                  │  Balance APIs  │                         │
│                  ├────────────────┤                         │
│                  │ GET /balance   │                         │
│                  │ POST /adjust   │                         │
│                  │ POST /init     │                         │
│                  └────────────────┘                         │
│                          │                                   │
│                  ┌───────▼────────┐                         │
│                  │ LeaveBalance   │                         │
│                  │    Model       │                         │
│                  └────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```prisma
model LeaveBalance {
  id            String    @id @default(uuid())
  userId        String
  leaveTypeId   String
  balance       Float     // Current available balance
  carryForward  Float     // Carried forward from previous period
  accrualRuleId String?   // Optional accrual rule
  lastAccruedAt DateTime  // Last accrual date
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user        User         @relation(...)
  leaveType   LeaveType    @relation(...)
  accrualRule LeaveAccrualRule? @relation(...)

  @@unique([userId, leaveTypeId])
}
```

---

## Backend Implementation

### Service Methods

Located in: `/backend/src/leave/leave.service.ts`

#### 1. Get User's Leave Balances

```typescript
async getUserLeaveBalances(userId: string)
```

**Purpose**: Retrieve all leave balances for a specific user

**Returns**: Array of LeaveBalance with leaveType and accrualRule details

**Usage**: Called by employee dashboard to display available balances

#### 2. Get Leave Balance by Type

```typescript
async getLeaveBalanceByType(userId: string, leaveTypeId: string)
```

**Purpose**: Get detailed balance information for a specific leave type

**Returns**: 
- Balance details
- Used days
- Available days
- Leave history (last 10 leaves)
- Total allocated days

**Usage**: Used for detailed balance view and history tracking

#### 3. Adjust Leave Balance

```typescript
async adjustLeaveBalance(
  userId: string,
  leaveTypeId: string,
  adjustment: number,
  reason: string,
  adjustedBy: string
)
```

**Purpose**: Manually adjust an employee's leave balance (admin only)

**Parameters**:
- `adjustment`: Number of days to add (positive) or subtract (negative)
- `reason`: Explanation for the adjustment (audit trail)
- `adjustedBy`: Admin user ID making the adjustment

**Validation**: Prevents negative balances

**Usage**: Manual corrections, compensations, policy changes

#### 4. Initialize Leave Balance

```typescript
async initializeLeaveBalance(
  userId: string,
  leaveTypeId: string,
  initialBalance: number,
  accrualRuleId?: string
)
```

**Purpose**: Create a new leave balance record for an employee

**Validation**: Prevents duplicate initialization for same user/leave type

**Usage**: Onboarding new employees or adding new leave types

#### 5. Get All Users' Balances

```typescript
async getAllUsersBalances()
```

**Purpose**: Retrieve all leave balances across all employees (admin only)

**Returns**: Array with user details, employee information, and leave types

**Usage**: Admin dashboard and balance management interface

### Controller Endpoints

Located in: `/backend/src/leave/leave.controller.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/leave/balance` | User | Get current user's balances |
| GET | `/leave/balance/:leaveTypeId` | User | Get detailed balance for specific type |
| POST | `/leave/balance/adjust` | Admin/HR | Adjust employee balance |
| POST | `/leave/balance/initialize` | Admin/HR | Initialize new balance |
| GET | `/leave/balance/all/users` | Admin/HR | Get all employees' balances |

### Authorization

- **Employee Endpoints**: Protected by `JwtAuthGuard`, user can only access own balances
- **Admin Endpoints**: Protected by `@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)` decorator

---

## Frontend Implementation

### API Layer

Located in: `/frontend/src/lib/api/leave.ts`

#### Types

```typescript
type LeaveBalance = {
  id: string;
  userId: string;
  leaveTypeId: string;
  balance: number;
  carryForward: number;
  accrualRuleId: string | null;
  lastAccruedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  leaveType: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    leavePolicy?: {
      maxDays: number;
      carryForwardCap: number;
      encashmentFlag: boolean;
      allowAdvance: boolean;
    } | null;
  };
  accrualRule?: {...} | null;
};

type LeaveBalanceDetails = LeaveBalance & {
  usedDays: number;
  availableDays: number;
  totalAllocated: number;
  leaveHistory: Array<{...}>;
};
```

#### Functions

```typescript
getUserBalances(): Promise<LeaveBalance[]>
getBalanceDetails(leaveTypeId: string): Promise<LeaveBalanceDetails>
adjustBalance(payload: AdjustBalancePayload): Promise<LeaveBalance>
initializeBalance(payload: InitializeBalancePayload): Promise<LeaveBalance>
getAllUsersBalances(): Promise<UserBalanceWithEmployee[]>
```

### React Query Hooks

Located in: `/frontend/src/lib/queries/leave.ts`

```typescript
// Employee hooks
useUserBalances()          // Get current user's balances
useBalanceDetails(id)      // Get detailed balance info

// Admin hooks
useAllUsersBalances()      // Get all employees' balances
useAdjustBalance()         // Adjust balance mutation
useInitializeBalance()     // Initialize balance mutation
```

**Features**:
- 5-minute stale time for balance queries
- Automatic cache invalidation on mutations
- Error handling with toast notifications

### Components

#### 1. LeaveBalanceCard

**Location**: `/frontend/src/components/leave/leave-balance-card.tsx`

**Purpose**: Display individual leave balance with visual indicators

**Features**:
- Progress bar showing available vs. used days
- Carry forward badge
- Policy information (carry forward cap, advance leave, encashment)
- Color-coded status (green/yellow/red based on balance)
- Responsive design

**Props**:
```typescript
interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  showDetails?: boolean;
  onClick?: () => void;
}
```

#### 2. Progress Component

**Location**: `/frontend/src/components/ui/progress.tsx`

**Purpose**: Visual progress bar for balance display

**Features**:
- Customizable value and max
- Smooth transitions
- Accessible markup

### Pages

#### 1. Employee Leave Page (Enhanced)

**Location**: `/frontend/src/app/dashboard/employee/leave/page.tsx`

**Enhancements**:
- Added "Your Leave Balances" section at the top
- Grid of LeaveBalanceCard components
- Real-time balance updates
- Loading states
- Empty state for employees without initialized balances

**Layout**:
```
┌────────────────────────────────────────┐
│  Leave Page Header                     │
├────────────────────────────────────────┤
│  Your Leave Balances                   │
│  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │ Card │  │ Card │  │ Card │        │
│  └──────┘  └──────┘  └──────┘        │
├────────────────────────────────────────┤
│  Apply for Leave Form │ Leave History │
└────────────────────────────────────────┘
```

#### 2. Admin Balance Management Page

**Location**: `/frontend/src/app/dashboard/admin/leave-balance/page.tsx`

**Features**:

1. **Statistics Dashboard**
   - Total employees
   - Total balance records
   - Number of leave types

2. **Balance Table**
   - Search by employee name, code, email, or leave type
   - Columns: Employee, Code, Leave Type, Balance, Carry Forward, Total, Actions
   - Real-time filtering
   - Sortable columns

3. **Adjust Balance Dialog**
   - Select employee and leave type (pre-filled)
   - Enter adjustment (positive or negative)
   - Provide reason (required for audit)
   - Shows current balance
   - Validates against negative balances

4. **Initialize Balance Dialog**
   - Select employee from dropdown
   - Select leave type
   - Enter initial balance
   - Optional accrual rule
   - Prevents duplicate initialization

**Layout**:
```
┌────────────────────────────────────────┐
│  Leave Balance Management Header       │
├──────────┬──────────┬──────────────────┤
│  Total   │  Total   │  Leave           │
│  Emps    │  Balance │  Types           │
├────────────────────────────────────────┤
│  Search Bar          [+ Initialize]    │
├────────────────────────────────────────┤
│  Employee Table                        │
│  ┌────┬────┬────┬────┬────┬────┬───┐ │
│  │Name│Code│Type│Bal │CF  │Tot │Act│ │
│  └────┴────┴────┴────┴────┴────┴───┘ │
└────────────────────────────────────────┘
```

### Navigation

Added menu item in `/frontend/src/modules/shared/config/navigation.ts`:

```typescript
{
  href: "/dashboard/admin/leave-balance",
  label: "Leave Balances",
  icon: CalendarCheck,
  roles: ["admin", "super-admin"],
  permissions: ["leave.approve"],
}
```

---

## User Flows

### Employee Flow: View Leave Balances

1. Employee navigates to "Leave" page
2. System fetches user's leave balances via `GET /leave/balance`
3. Display balance cards for each leave type
4. Employee sees:
   - Available days
   - Carry forward days
   - Progress bar
   - Policy information
5. Employee can apply for leave with full visibility of remaining balance

### Admin Flow: Adjust Balance

1. Admin navigates to "Leave Balances" page
2. System fetches all employees' balances via `GET /leave/balance/all/users`
3. Admin searches for employee
4. Admin clicks "Adjust" button on specific balance row
5. Dialog opens with:
   - Employee name and current balance
   - Input for adjustment amount
   - Textarea for reason
6. Admin enters adjustment (e.g., +5 or -3)
7. Admin provides reason (e.g., "Compensation for overtime")
8. System calls `POST /leave/balance/adjust`
9. Success toast displayed
10. Table refreshes with new balance

### Admin Flow: Initialize Balance

1. Admin navigates to "Leave Balances" page
2. Admin clicks "+ Initialize Balance" button
3. Dialog opens with form:
   - Select employee dropdown
   - Select leave type dropdown
   - Input initial balance
4. Admin fills form
5. System calls `POST /leave/balance/initialize`
6. New balance record created
7. Table refreshes showing new balance

---

## Testing Guide

### Manual Testing Checklist

#### Employee Tests

- [ ] **View Balances**
  - [ ] Navigate to Leave page
  - [ ] Verify all leave types displayed
  - [ ] Check balance numbers are correct
  - [ ] Verify carry forward badge appears when > 0
  - [ ] Check progress bar reflects correct percentage

- [ ] **Empty State**
  - [ ] Test with employee with no balances
  - [ ] Verify helpful message displayed
  - [ ] Confirm "Contact HR" message shows

- [ ] **Responsive Design**
  - [ ] Test on mobile (320px)
  - [ ] Test on tablet (768px)
  - [ ] Test on desktop (1024px+)
  - [ ] Verify cards stack properly

#### Admin Tests

- [ ] **View All Balances**
  - [ ] Navigate to Leave Balances page
  - [ ] Verify statistics cards show correct counts
  - [ ] Check table loads all employee balances
  - [ ] Verify employee names and codes display

- [ ] **Search Functionality**
  - [ ] Search by employee name
  - [ ] Search by employee code
  - [ ] Search by email
  - [ ] Search by leave type
  - [ ] Verify "No results" message on invalid search

- [ ] **Adjust Balance - Positive**
  - [ ] Click Adjust on any balance
  - [ ] Enter positive number (e.g., 5)
  - [ ] Provide reason
  - [ ] Submit and verify success toast
  - [ ] Check table updates immediately
  - [ ] Verify new balance is correct

- [ ] **Adjust Balance - Negative**
  - [ ] Click Adjust on any balance
  - [ ] Enter negative number (e.g., -2)
  - [ ] Provide reason
  - [ ] Submit and verify success toast
  - [ ] Verify balance decreases

- [ ] **Adjust Balance - Validation**
  - [ ] Try adjustment that would result in negative balance
  - [ ] Verify error message
  - [ ] Try without reason
  - [ ] Verify validation message

- [ ] **Initialize Balance**
  - [ ] Click "+ Initialize Balance"
  - [ ] Select employee from dropdown
  - [ ] Select leave type
  - [ ] Enter initial balance
  - [ ] Submit and verify success
  - [ ] Check new row appears in table

- [ ] **Initialize Balance - Duplicate**
  - [ ] Try initializing same employee + leave type twice
  - [ ] Verify error message about duplicate

### API Testing

#### Endpoint Tests

```bash
# Test as employee
curl -X GET http://localhost:3000/leave/balance \
  -H "Authorization: Bearer <employee_token>"

# Expected: Array of employee's balances

# Test balance details
curl -X GET http://localhost:3000/leave/balance/<leave_type_id> \
  -H "Authorization: Bearer <employee_token>"

# Expected: Detailed balance with history

# Test as admin - get all balances
curl -X GET http://localhost:3000/leave/balance/all/users \
  -H "Authorization: Bearer <admin_token>"

# Expected: All employees' balances

# Test adjust balance
curl -X POST http://localhost:3000/leave/balance/adjust \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user_id>",
    "leaveTypeId": "<leave_type_id>",
    "adjustment": 5,
    "reason": "Test adjustment"
  }'

# Expected: Updated balance object

# Test initialize balance
curl -X POST http://localhost:3000/leave/balance/initialize \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user_id>",
    "leaveTypeId": "<leave_type_id>",
    "initialBalance": 20
  }'

# Expected: New balance object
```

### Integration Tests

Test balance deduction on leave approval:

1. Check employee balance (e.g., 20 days)
2. Apply for 5 days leave
3. Line manager approves (status → PROCESSING)
4. Check balance: Should still be 20 (not deducted yet)
5. HR approves (status → APPROVED)
6. Check balance: Should now be 15 (deducted)

Test balance restoration on rejection:

1. Check employee balance (e.g., 15 days)
2. Apply for 3 days leave
3. Manager approves
4. HR rejects
5. Check balance: Should remain 15 (not deducted)

---

## API Reference

### Employee Endpoints

#### Get User's Leave Balances

```
GET /leave/balance
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "leaveTypeId": "uuid",
    "balance": 15.5,
    "carryForward": 2,
    "accrualRuleId": "uuid",
    "lastAccruedAt": "2025-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2025-12-13T00:00:00.000Z",
    "leaveType": {
      "id": "uuid",
      "name": "Annual Leave",
      "code": "AL",
      "description": "Paid annual leave",
      "leavePolicy": {
        "maxDays": 20,
        "carryForwardCap": 5,
        "encashmentFlag": true,
        "allowAdvance": false
      }
    },
    "accrualRule": {
      "id": "uuid",
      "frequency": "MONTHLY",
      "ratePerPeriod": 1.67,
      "accrualStrategy": "PRORATE",
      "prorateFlag": true,
      "startAfterDays": 90,
      "resetMonthDay": null
    }
  }
]
```

#### Get Balance Details

```
GET /leave/balance/:leaveTypeId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": "uuid",
  "balance": 15.5,
  "carryForward": 2,
  "usedDays": 4.5,
  "availableDays": 15.5,
  "totalAllocated": 20,
  "leaveType": {...},
  "leaveHistory": [
    {
      "id": "uuid",
      "startDate": "2025-12-20T00:00:00.000Z",
      "endDate": "2025-12-22T00:00:00.000Z",
      "status": "APPROVED",
      "reason": "Family vacation",
      "createdAt": "2025-12-10T00:00:00.000Z"
    }
  ]
}
```

### Admin Endpoints

#### Get All Users' Balances

```
GET /leave/balance/all/users
Authorization: Bearer <admin_token>
Roles: ADMIN, HR_MANAGER
```

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "leaveTypeId": "uuid",
    "balance": 18,
    "carryForward": 0,
    "user": {
      "id": "uuid",
      "email": "john.doe@company.com",
      "employee": {
        "firstName": "John",
        "lastName": "Doe",
        "employeeCode": "EMP001"
      }
    },
    "leaveType": {
      "id": "uuid",
      "name": "Annual Leave",
      "code": "AL"
    }
  }
]
```

#### Adjust Balance

```
POST /leave/balance/adjust
Authorization: Bearer <admin_token>
Roles: ADMIN, HR_MANAGER
Content-Type: application/json

{
  "userId": "uuid",
  "leaveTypeId": "uuid",
  "adjustment": 5,
  "reason": "Compensation for overtime work"
}
```

**Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "leaveTypeId": "uuid",
  "balance": 23,
  "carryForward": 0,
  "updatedAt": "2025-12-13T10:30:00.000Z"
}
```

**Validation**:
- Adjustment cannot result in negative balance
- Reason must be at least 5 characters

#### Initialize Balance

```
POST /leave/balance/initialize
Authorization: Bearer <admin_token>
Roles: ADMIN, HR_MANAGER
Content-Type: application/json

{
  "userId": "uuid",
  "leaveTypeId": "uuid",
  "initialBalance": 20,
  "accrualRuleId": "uuid" // optional
}
```

**Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "leaveTypeId": "uuid",
  "balance": 20,
  "carryForward": 0,
  "accrualRuleId": "uuid",
  "lastAccruedAt": "2025-12-13T00:00:00.000Z",
  "createdAt": "2025-12-13T10:35:00.000Z",
  "updatedAt": "2025-12-13T10:35:00.000Z"
}
```

**Validation**:
- Cannot initialize duplicate balance for same user + leave type

---

## Best Practices

### Security

1. **Authorization**: Balance adjustments restricted to Admin/HR only
2. **Validation**: Prevent negative balances through backend validation
3. **Audit Trail**: All adjustments require a reason for tracking
4. **User Isolation**: Employees can only view their own balances

### Performance

1. **Caching**: 5-minute stale time for balance queries
2. **Pagination**: Consider implementing for large employee counts
3. **Indexing**: Database index on `userId_leaveTypeId` for fast lookups
4. **Query Optimization**: Include relations in initial query to avoid N+1

### UX

1. **Real-time Updates**: Automatic cache invalidation on mutations
2. **Loading States**: Spinners during data fetches
3. **Empty States**: Helpful messages when no balances exist
4. **Error Handling**: Toast notifications for success/error
5. **Responsive Design**: Mobile-first approach for all components

---

## Troubleshooting

### Common Issues

#### Balance not displaying for employee

**Cause**: Balance not initialized for that leave type

**Solution**: Admin should use "Initialize Balance" feature

#### Adjustment fails with negative balance error

**Cause**: Adjustment would result in balance < 0

**Solution**: Check current balance and adjust accordingly, or initialize with higher balance first

#### Duplicate initialization error

**Cause**: Balance already exists for user + leave type

**Solution**: Use "Adjust Balance" instead to modify existing balance

#### Balance not deducted after leave approval

**Cause**: Only deducted after HR approval (Step 2), not manager approval (Step 1)

**Solution**: Verify leave status is "APPROVED", not just "PROCESSING"

---

## Future Enhancements

1. **Balance History**: Track all adjustments with timestamps
2. **Accrual Automation**: Automatic monthly/yearly balance accruals
3. **Notifications**: Email employees when balance is adjusted
4. **Bulk Operations**: Initialize or adjust multiple balances at once
5. **Balance Forecasting**: Predict future balance based on upcoming leaves
6. **Encashment**: Allow employees to encash unused leave
7. **Reports**: Generate balance reports by department/leave type
8. **Integration**: Sync with payroll for encashment processing

---

## Conclusion

The Leave Balance feature is now fully implemented with:

✅ Backend endpoints for balance operations
✅ Admin interface for balance management
✅ Employee interface for balance viewing
✅ Comprehensive validation and error handling
✅ Real-time updates and caching
✅ Audit trail for adjustments
✅ Responsive design
✅ Complete documentation

The feature integrates seamlessly with the existing leave management system and provides full visibility into employee leave balances for both employees and administrators.

For questions or issues, refer to the troubleshooting section or contact the development team.

---

**Document Version**: 1.0
**Last Updated**: December 13, 2025
**Author**: GitHub Copilot
