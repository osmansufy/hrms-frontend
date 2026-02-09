# Authentication Features - Test Suite

This directory contains comprehensive Jest tests for authentication features including login, forgot password, and reset password.

## Test Files

### 1. `sign-in.test.tsx`
Tests for the sign-in form component (`SignInView`).

**Test Coverage:**
- ✅ Initial render with different role parameters (member, admin, super-admin)
- ✅ Form validation (email format, password length)
- ✅ Password visibility toggle
- ✅ Successful login flow
- ✅ Role-based redirects
- ✅ Callback URL handling
- ✅ Admin authorization checks
- ✅ Loading states
- ✅ Error handling (network errors, invalid credentials, session errors)
- ✅ Auto-redirect on authentication
- ✅ Role priority handling (super-admin > admin > employee)
- ✅ Navigation links (forgot password, console selection)

**Key Test Cases:**
- Validates email and password before submission
- Shows success message and redirects after login
- Checks admin authorization when accessing admin portals
- Handles various error scenarios with proper error messages
- Tests role-based routing and priority

### 2. `forgot-password.test.tsx`
Tests for the forgot password form component (`ForgotPasswordView`).

**Test Coverage:**
- ✅ Initial render and form structure
- ✅ Form validation (email format, empty fields)
- ✅ Successful submission flow
- ✅ Success state display
- ✅ Loading states
- ✅ Error handling (network errors, Axios errors, nested errors)
- ✅ Navigation links
- ✅ Form state management

**Key Test Cases:**
- Validates email format before submission
- Shows success message after API call
- Displays "Check your email" view after submission
- Handles various error scenarios with proper error messages
- Tests loading state during API calls

### 2. `reset-password.test.tsx`
Tests for the reset password form component (`ResetPasswordView`).

**Test Coverage:**
- ✅ Invalid token handling
- ✅ Initial render with valid token
- ✅ Password visibility toggles
- ✅ Password validation (length, complexity, matching)
- ✅ Successful submission flow
- ✅ Loading states
- ✅ Error handling (invalid token, expired token, network errors)
- ✅ Navigation links
- ✅ Password requirements display

**Key Test Cases:**
- Shows error when token is missing
- Validates password strength (8+ chars, uppercase, lowercase, number/special)
- Validates password confirmation match
- Redirects to sign-in after successful reset
- Handles expired/invalid token errors

### 3. `../lib/api/auth.test.ts`
Unit tests for the auth API functions.

**Test Coverage:**
- ✅ `forgotPassword` API call
- ✅ `resetPassword` API call
- ✅ Error handling for API failures
- ✅ Response data structure validation

## Running the Tests

### Run all tests:
```bash
npm test
# or
pnpm test
```

### Run tests in watch mode:
```bash
npm run test:watch
# or
pnpm test:watch
```

### Run specific test file:
```bash
npm test sign-in
npm test forgot-password
npm test reset-password
npm test lib/api/auth
```

### Run with coverage:
```bash
npm run test:coverage
# or
pnpm test:coverage
```

## Test Structure

All tests follow the same pattern:

1. **Mock Setup**: Mocks for Next.js navigation, API calls, and toast notifications
2. **Component Rendering**: Uses `@testing-library/react` for rendering
3. **User Interactions**: Uses `@testing-library/user-event` for simulating user actions
4. **Assertions**: Uses `@testing-library/jest-dom` matchers for DOM assertions

## Mocked Dependencies

- `next/navigation` - Router navigation
- `@/lib/api/auth` - API functions
- `sonner` - Toast notifications

## Example Test Output

```
PASS __tests__/(auth)/sign-in.test.tsx
PASS __tests__/(auth)/forgot-password.test.tsx
PASS __tests__/(auth)/reset-password.test.tsx

Test Suites: 3 passed, 3 total
Tests:       73 passed, 73 total
Snapshots:   0 total
Time:        2.828 s
```

**Breakdown:**
- Sign-in: 33 tests
- Forgot password: 17 tests
- Reset password: 23 tests
- **Total: 73 tests**

## Notes

- Tests use `waitFor` for async operations
- All user interactions are simulated with `userEvent`
- Form submissions use `fireEvent.submit(form)` to properly trigger react-hook-form validation
- Error scenarios test both simple errors and nested Axios error structures
- Password validation tests match backend requirements
- Tests verify both UI state and API call parameters
- Password inputs wrapped in divs use `getByPlaceholderText` instead of `getByLabelText`
- Console selection links use `getAllByRole` and filter by href to avoid matching "Super Admin" when searching for "Admin"
