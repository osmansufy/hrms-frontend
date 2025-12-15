# Browser Testing Guide - Admin Leave Management Integration

## 🚀 Pre-Testing Setup

### 1. Start Backend Server
```bash
cd /Users/codeentechnologies/Desktop/hrms/backend
npm run start:dev
# or
pnpm start:dev

# Verify backend is running at: http://localhost:4000
```

### 2. Start Frontend Server
```bash
cd /Users/codeentechnologies/Desktop/hrms/frontend
npm run dev
# or
pnpm dev

# Frontend should be running at: http://localhost:3000
```

### 3. Login as Admin
- Navigate to: http://localhost:3000/sign-in
- Login with admin credentials
- Ensure user has `ADMIN` or `HR_MANAGER` role

---

## 📋 Testing Checklist

### ✅ Phase 1: Tab Navigation

#### Test 1.1: Access Admin Leave Page
- [ ] Navigate to: `http://localhost:3000/dashboard/admin/leave`
- [ ] Page loads without errors
- [ ] Header shows "Leave Management"
- [ ] Description shows "Manage leave approvals, policies, balances, and analytics"
- [ ] 7 tabs visible: Dashboard, Balances, Audit, Approvals, Amendments, Policies, Accrual Rules

#### Test 1.2: Tab Switching
- [ ] Click each tab (Dashboard → Balances → Audit → Approvals → Amendments → Policies → Accruals)
- [ ] Each tab content loads correctly
- [ ] No console errors in browser DevTools
- [ ] Active tab is highlighted
- [ ] URL does not change (tabs are local state)
- [ ] Tab icons display correctly

#### Test 1.3: Default Tab
- [ ] Refresh page (Ctrl/Cmd + R)
- [ ] Dashboard tab is active by default
- [ ] Dashboard content loads immediately

---

### ✅ Phase 2: Dashboard Tab Testing

#### Test 2.1: Metric Cards
- [ ] 4 metric cards display at top
- [ ] **Total Employees** shows number with Users icon
- [ ] **Days Allocated** shows number with Calendar icon
- [ ] **Days Used** shows number with percentage and TrendingUp icon
- [ ] **Total Alerts** shows count with critical count in parentheses
- [ ] Alert card color changes based on severity (red if critical > 0)

#### Test 2.2: Alerts Section
- [ ] Alerts section displays if alerts exist
- [ ] **Critical Alerts** (Negative Balances):
  - [ ] Red badge shows "Critical"
  - [ ] Shows count in heading
  - [ ] Lists up to 5 employees with negative balances
  - [ ] Shows employee name, code, leave type, and balance
  - [ ] Displays "+ X more" if more than 5 exist
- [ ] **Warning Alerts** (High Usage):
  - [ ] Yellow badge shows "Warning"
  - [ ] Shows count in heading
  - [ ] Lists up to 3 employees with high usage
  - [ ] Shows percentage used
- [ ] **Info Alerts** (Approaching Limits):
  - [ ] Blue badge shows "Info"
  - [ ] Shows employees with low balances (≤2 days)
- [ ] **Unusual Adjustments**:
  - [ ] Shows large adjustments (>10 days)
  - [ ] Displays admin name and reason

#### Test 2.3: Department Breakdown
- [ ] Department breakdown card displays
- [ ] Shows list of departments
- [ ] Each department shows:
  - [ ] Department name
  - [ ] Employee count
  - [ ] Allocated/Used/Available/Utilization stats
  - [ ] Grid layout is readable

#### Test 2.4: Leave Type Breakdown
- [ ] Leave type breakdown card displays
- [ ] Shows list of leave types
- [ ] Each type shows similar stats to departments
- [ ] Data matches summary endpoint response

#### Test 2.5: Real-time Updates
- [ ] Wait 30 seconds (or use network throttling)
- [ ] Data should auto-refresh
- [ ] No page reload required
- [ ] Metrics update smoothly

#### Test 2.6: Loading State
- [ ] Hard refresh page (Shift + Ctrl/Cmd + R)
- [ ] Loading skeletons display briefly
- [ ] Smooth transition to actual data

#### Test 2.7: Error State
- [ ] Stop backend server
- [ ] Refresh Dashboard tab
- [ ] Error message displays: "Error Loading Dashboard"
- [ ] User-friendly message: "Failed to load dashboard data"
- [ ] Restart backend, refresh, verify recovery

---

### ✅ Phase 3: Balances Tab Testing

#### Test 3.1: Initial Load
- [ ] Click Balances tab
- [ ] Table loads with employee data
- [ ] Shows 20 rows per page (default)
- [ ] Statistics summary shows at top:
  - [ ] Total employees
  - [ ] Negative balances count
  - [ ] Low balances count

#### Test 3.2: Search Functionality
- [ ] Type employee name in search box
- [ ] Results filter in real-time (debounced)
- [ ] Type employee email
- [ ] Results update correctly
- [ ] Clear search, all results return
- [ ] Page resets to 1 when searching

#### Test 3.3: Status Filter
- [ ] Click Status dropdown
- [ ] Options visible: All Statuses, Normal, Low, Negative
- [ ] Select "Negative"
- [ ] Only negative balance employees show
- [ ] Badge colors match status (red for negative)
- [ ] Select "Low"
- [ ] Only low balance employees show (yellow badges)
- [ ] Select "Normal"
- [ ] Only normal balance employees show (green badges)
- [ ] Reset to "All Statuses"
- [ ] Page resets to 1 when filtering

#### Test 3.4: Year Filter
- [ ] Click Year dropdown
- [ ] Shows current year, previous year, 2 years ago
- [ ] Select previous year
- [ ] Data updates for that year
- [ ] Select current year again
- [ ] Page resets to 1 when changing year

#### Test 3.5: Table Display
- [ ] **Columns visible:**
  - [ ] Employee (name, email, department)
  - [ ] Code (employee code)
  - [ ] Leave Type
  - [ ] Available (bold, prominent)
  - [ ] Used
  - [ ] Total Allocated
  - [ ] Status (badge)
  - [ ] Actions (Adjust button)
- [ ] **Data formatting:**
  - [ ] Employee info stacked vertically
  - [ ] Department shows in gray
  - [ ] Employee code in monospace font
  - [ ] Available balance is bold and larger
  - [ ] Status badge colored correctly
- [ ] **Status badges:**
  - [ ] NEGATIVE = red background
  - [ ] LOW = yellow background
  - [ ] NORMAL = green background

#### Test 3.6: Pagination
- [ ] Bottom of table shows pagination controls
- [ ] Shows "Showing X to Y of Z results"
- [ ] **Previous button:**
  - [ ] Disabled on page 1
  - [ ] Enabled on page 2+
  - [ ] Clicking goes to previous page
- [ ] **Next button:**
  - [ ] Enabled when more pages exist
  - [ ] Disabled on last page
  - [ ] Clicking goes to next page
- [ ] Page number displays correctly (e.g., "Page 2 of 8")
- [ ] Data updates when changing pages
- [ ] No duplicate rows appear

#### Test 3.7: CSV Export
- [ ] Click "Export CSV" button
- [ ] Button shows "Exporting..." during process
- [ ] Toast notification: "Preparing export..."
- [ ] CSV file downloads automatically
- [ ] File name format: `leave_balances_YYYY.csv`
- [ ] Open CSV in Excel/Numbers
- [ ] Data matches table content
- [ ] Headers are correct
- [ ] Toast notification: "Export downloaded successfully"

#### Test 3.8: Adjust Action
- [ ] Click "Adjust" button on any row
- [ ] Navigates to `/dashboard/admin/leave-balance`
- [ ] Query params include `userId` and `leaveTypeId`
- [ ] Existing leave-balance page loads correctly
- [ ] Can navigate back to Balances tab

#### Test 3.9: Loading State
- [ ] Switch to another tab and back
- [ ] Loading skeleton displays briefly
- [ ] Shows 5 skeleton rows

#### Test 3.10: Empty State
- [ ] Apply filters that return no results
- [ ] Card displays: "No Balances Found"
- [ ] Message: "No leave balances match your current filters"
- [ ] Remove filters, data returns

#### Test 3.11: Error State
- [ ] Stop backend server
- [ ] Switch to Balances tab
- [ ] Error message displays
- [ ] User-friendly message shown
- [ ] Restart backend, refresh, verify recovery

---

### ✅ Phase 4: Audit Trail Tab Testing

#### Test 4.1: Initial Load
- [ ] Click Audit tab
- [ ] Table loads with adjustment history
- [ ] Shows 20 rows per page (default)
- [ ] Most recent adjustments first

#### Test 4.2: Date Range Filters
- [ ] **Start Date:**
  - [ ] Click start date input
  - [ ] Date picker appears
  - [ ] Select a date
  - [ ] Results filter to dates >= selected
  - [ ] Page resets to 1
- [ ] **End Date:**
  - [ ] Click end date input
  - [ ] Date picker appears
  - [ ] Select a date
  - [ ] Results filter to dates <= selected
  - [ ] Page resets to 1
- [ ] **Both Dates:**
  - [ ] Select both start and end dates
  - [ ] Results show only adjustments in range
  - [ ] Clear dates, all results return

#### Test 4.3: Table Display
- [ ] **Columns visible:**
  - [ ] Date/Time (formatted)
  - [ ] Employee (name + code)
  - [ ] Leave Type
  - [ ] Adjustment (badge)
  - [ ] Before
  - [ ] After
  - [ ] Reason
  - [ ] Admin (name + email)
- [ ] **Data formatting:**
  - [ ] Date shows as MM/DD/YYYY
  - [ ] Time shows as HH:MM:SS AM/PM
  - [ ] Employee code in smaller gray text
  - [ ] Adjustment badge colored:
    - [ ] Green with "+" for positive
    - [ ] Red with "-" for negative
  - [ ] Before/After values bold
  - [ ] Reason truncated with ellipsis if long
  - [ ] Hover over reason shows full text (tooltip)
  - [ ] Admin email in gray text

#### Test 4.4: Pagination
- [ ] Bottom shows pagination controls
- [ ] Shows "Showing X to Y of Z results"
- [ ] Previous/Next buttons work correctly
- [ ] Page number displays correctly
- [ ] Data updates when changing pages

#### Test 4.5: Loading State
- [ ] Switch to another tab and back
- [ ] Loading skeleton displays briefly

#### Test 4.6: Empty State
- [ ] Select date range with no data
- [ ] Card displays: "No Adjustments Found"
- [ ] Message: "No leave balance adjustments match your current filters"

#### Test 4.7: Error State
- [ ] Stop backend server
- [ ] Switch to Audit tab
- [ ] Error message displays
- [ ] Restart backend, verify recovery

---

### ✅ Phase 5: Existing Tabs (Regression Testing)

#### Test 5.1: Approvals Tab
- [ ] Click Approvals tab
- [ ] Existing functionality works
- [ ] Can approve/reject leaves
- [ ] No console errors

#### Test 5.2: Amendments Tab
- [ ] Click Amendments tab
- [ ] Existing functionality works
- [ ] Can view amendments
- [ ] No console errors

#### Test 5.3: Policies Tab
- [ ] Click Policies tab
- [ ] Existing functionality works
- [ ] Can view/edit policies
- [ ] No console errors

#### Test 5.4: Accrual Rules Tab
- [ ] Click Accrual Rules tab
- [ ] Existing functionality works
- [ ] Can view accrual rules
- [ ] No console errors

---

### ✅ Phase 6: Responsive Design Testing

#### Test 6.1: Mobile (375px)
Open DevTools → Toggle Device Toolbar → Set to iPhone 12 (375px)

- [ ] **Tab Navigation:**
  - [ ] Tabs scroll horizontally
  - [ ] Can swipe/scroll to see all tabs
  - [ ] Active tab visible
- [ ] **Dashboard Tab:**
  - [ ] Metric cards stack vertically
  - [ ] Cards are full-width
  - [ ] Text remains readable
  - [ ] Icons visible
- [ ] **Balances Tab:**
  - [ ] Filters stack vertically
  - [ ] Search input full-width
  - [ ] Table scrolls horizontally
  - [ ] All columns visible with scroll
  - [ ] Export button full-width or wraps
- [ ] **Audit Tab:**
  - [ ] Date inputs stack vertically
  - [ ] Table scrolls horizontally
  - [ ] All data readable

#### Test 6.2: Tablet (768px)
Set device to iPad (768px)

- [ ] **Tab Navigation:**
  - [ ] Tabs may wrap to 2 rows or scroll
  - [ ] All tabs accessible
- [ ] **Dashboard Tab:**
  - [ ] Metric cards in 2 columns
  - [ ] Layout balanced
- [ ] **Balances Tab:**
  - [ ] Filters in 2 columns
  - [ ] Table remains scrollable
- [ ] **Audit Tab:**
  - [ ] Date inputs side-by-side
  - [ ] Table scrollable

#### Test 6.3: Desktop (1024px+)
Set to Desktop (1920px)

- [ ] **Tab Navigation:**
  - [ ] All 7 tabs in single row
  - [ ] Properly spaced
- [ ] **Dashboard Tab:**
  - [ ] Metric cards in 4 columns
  - [ ] Optimal use of space
- [ ] **Balances Tab:**
  - [ ] Filters in 4 columns
  - [ ] Table full-width, no scroll needed
- [ ] **Audit Tab:**
  - [ ] Filters side-by-side with good spacing
  - [ ] Table uses full width

---

### ✅ Phase 7: Error Scenario Testing

#### Test 7.1: 401 Unauthorized
- [ ] Open DevTools → Network tab
- [ ] Add breakpoint or use network throttling
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Refresh page
- [ ] Should redirect to `/sign-in`
- [ ] Login again, return to admin leave page

#### Test 7.2: 403 Forbidden
- [ ] Login as user without admin role
- [ ] Try to access `/dashboard/admin/leave`
- [ ] Should see forbidden/access denied message
- [ ] Or should redirect to appropriate page

#### Test 7.3: 500 Server Error
- [ ] In backend, temporarily break an endpoint (comment out logic)
- [ ] Reload Dashboard tab
- [ ] Error state displays
- [ ] User-friendly message shown
- [ ] No app crash
- [ ] Fix backend, verify recovery

#### Test 7.4: Network Offline
- [ ] Open DevTools → Network tab
- [ ] Select "Offline" from throttling dropdown
- [ ] Try to load any tab
- [ ] Error message displays
- [ ] Select "No throttling"
- [ ] Data loads correctly

#### Test 7.5: Slow Network
- [ ] Open DevTools → Network tab
- [ ] Select "Slow 3G" from throttling
- [ ] Navigate between tabs
- [ ] Loading skeletons display longer
- [ ] UI remains responsive
- [ ] No timeout errors

---

### ✅ Phase 8: Browser Console Testing

#### Test 8.1: Console Errors
- [ ] Open DevTools → Console tab
- [ ] Clear console
- [ ] Navigate through all tabs
- [ ] **No errors should appear**
- [ ] Only expected warnings (if any)
- [ ] No React key warnings
- [ ] No TypeScript errors

#### Test 8.2: Network Requests
- [ ] Open DevTools → Network tab
- [ ] Clear network log
- [ ] Click Dashboard tab
- [ ] Should see:
  - [ ] `GET /admin/leave-balances/summary?year=2025`
  - [ ] `GET /admin/leave-balances/alerts?year=2025`
- [ ] Click Balances tab
- [ ] Should see:
  - [ ] `GET /admin/leave-balances?page=1&pageSize=20&year=2025`
- [ ] Click Audit tab
- [ ] Should see:
  - [ ] `GET /admin/leave-balances/adjustments?page=1&pageSize=20`
- [ ] All requests return 200 OK
- [ ] Response times reasonable (<1s)

#### Test 8.3: React Query DevTools (if available)
- [ ] Open React Query DevTools
- [ ] Check query cache
- [ ] Verify queries are cached correctly
- [ ] Check stale times (30s/60s)
- [ ] Verify mutations invalidate correctly

---

### ✅ Phase 9: Data Accuracy Testing

#### Test 9.1: Dashboard Metrics
- [ ] Compare metric card values with backend data
- [ ] Check database for actual counts
- [ ] Verify utilization % calculation:
  - [ ] Formula: (Used / Allocated) * 100
  - [ ] Should match backend response

#### Test 9.2: Balances Table
- [ ] Pick an employee from table
- [ ] Verify balance values against database
- [ ] Check Total Allocated calculation:
  - [ ] Formula: Opening + Accrued + Carried + Adjusted
  - [ ] Should match displayed value
- [ ] Verify Available balance:
  - [ ] Formula: Total Allocated - Used - Pending
  - [ ] Should match displayed value

#### Test 9.3: Audit Trail
- [ ] Find an adjustment in table
- [ ] Verify Before/After values
- [ ] Check adjustment amount
- [ ] Verify admin attribution
- [ ] Confirm date/time accuracy

---

### ✅ Phase 10: Performance Testing

#### Test 10.1: Initial Load Time
- [ ] Clear browser cache
- [ ] Navigate to `/dashboard/admin/leave`
- [ ] Measure time to interactive
- [ ] Should be < 2 seconds on fast connection

#### Test 10.2: Tab Switching Performance
- [ ] Switch between tabs rapidly
- [ ] No lag or freezing
- [ ] Cached data loads instantly
- [ ] New data fetches smoothly

#### Test 10.3: Large Dataset
- [ ] If database has 100+ employees
- [ ] Pagination prevents loading all at once
- [ ] Table renders smoothly
- [ ] No scroll lag

#### Test 10.4: Memory Leaks
- [ ] Open DevTools → Performance → Memory
- [ ] Take heap snapshot
- [ ] Switch tabs multiple times
- [ ] Take another snapshot
- [ ] Compare memory usage
- [ ] Should not continuously increase

---

## 🐛 Bug Reporting Template

If you find any issues, document them using this format:

```markdown
### Bug Report

**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Tab/Component:** Dashboard / Balances / Audit / Other

**Steps to Reproduce:**
1. Navigate to...
2. Click on...
3. Enter...
4. Observe...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[Attach screenshots if applicable]

**Browser:**
- Browser: Chrome/Firefox/Safari
- Version: [e.g., 120.0.0]
- OS: macOS/Windows/Linux

**Console Errors:**
```
[Paste any console errors]
```

**Network Request:**
```
[Paste failed request details if applicable]
```
```

---

## ✅ Final Verification

After completing all tests above:

- [ ] All critical tests pass
- [ ] No console errors
- [ ] All features work as expected
- [ ] Responsive design works
- [ ] Error handling works
- [ ] Performance is acceptable
- [ ] Data accuracy verified
- [ ] No regressions in existing functionality

---

## 🚀 Ready for PR

Once testing is complete and all tests pass:

1. Create PR using template in `PR_CHECKLIST.md`
2. Add screenshots to PR description
3. List any bugs found and fixed
4. Note any known limitations
5. Request code review

---

**Testing completed by:** _____________  
**Date:** _____________  
**Result:** ✅ PASS / ❌ FAIL  
**Notes:** _____________
