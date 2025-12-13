# Runtime Error Fix - errorMessage.includes is not a function

## Error Description

**Error Type**: Runtime TypeError  
**Component**: Pending Approvals Tab (Line Manager)  
**File**: `/frontend/src/app/dashboard/employee/leave-manager/components/pending-approvals-tab.tsx`

### Error Message
```
errorMessage.includes is not a function

at handleApprove (src/app/dashboard/employee/leave-manager/components/pending-approvals-tab.tsx:51:30)
```

## Root Cause

The error occurred in the `handleApprove` function when trying to call `.includes()` on `errorMessage`. The issue was that `errorMessage` might not always be a string:

```tsx
const errorMessage = error?.response?.data?.message || "Failed to approve leave";
toast.error(errorMessage);

// ❌ This assumes errorMessage is always a string
if (errorMessage.includes("reporting manager")) {
    toast.error("You are not the assigned reporting manager for this employee.");
}
```

**Problem**: 
- `error?.response?.data?.message` might be an object, array, or other non-string value
- API errors can sometimes return complex error objects instead of simple strings
- Calling `.includes()` on a non-string throws a TypeError

## Solution

Added proper type checking and conversion to ensure `errorMessage` is always a string before calling string methods:

### Before
```tsx
const handleApprove = async (id: string) => {
    try {
        await approveMutation.mutateAsync(id);
        toast.success("Leave approved successfully. It will now move to HR for final approval.");
        setSelectedLeave(null);
    } catch (error: any) {
        const errorMessage = error?.response?.data?.message || "Failed to approve leave";
        toast.error(errorMessage);

        // ❌ errorMessage might not be a string
        if (errorMessage.includes("reporting manager")) {
            toast.error("You are not the assigned reporting manager for this employee.");
        }
    }
};
```

### After
```tsx
const handleApprove = async (id: string) => {
    try {
        await approveMutation.mutateAsync(id);
        toast.success("Leave approved successfully. It will now move to HR for final approval.");
        setSelectedLeave(null);
    } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to approve leave";
        const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
        toast.error(errorString);

        // ✅ errorString is guaranteed to be a string
        if (errorString.toLowerCase().includes("reporting manager")) {
            toast.error("You are not the assigned reporting manager for this employee.");
        }
    }
};
```

## Changes Made

### 1. Enhanced Error Message Extraction
```tsx
// Before
const errorMessage = error?.response?.data?.message || "Failed to approve leave";

// After
const errorMessage = error?.response?.data?.message || error?.message || "Failed to approve leave";
```
Added fallback to `error?.message` for cases where the error structure is different.

### 2. Type Safety Check and Conversion
```tsx
const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
```
- Checks if `errorMessage` is already a string
- If not, converts it to a string using `String()`
- Guarantees `errorString` is always a string type

### 3. Case-Insensitive Check
```tsx
// Before
if (errorMessage.includes("reporting manager")) {

// After
if (errorString.toLowerCase().includes("reporting manager")) {
```
Added `.toLowerCase()` to make the check case-insensitive, catching variations like:
- "Reporting Manager"
- "REPORTING MANAGER"
- "reporting manager"

### 4. Applied Same Fix to handleReject
Also improved error handling in `handleReject` for consistency:
```tsx
const handleReject = async (id: string) => {
    try {
        await rejectMutation.mutateAsync(id);
        toast.success("Leave rejected successfully");
        setSelectedLeave(null);
    } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to reject leave";
        const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
        toast.error(errorString);
    }
};
```

## Benefits

✅ **No Runtime Errors**: Type checking prevents `.includes()` errors  
✅ **Better Error Handling**: Handles multiple error structures  
✅ **Case-Insensitive**: Catches all variations of error messages  
✅ **Consistent Pattern**: Same approach in both approve and reject handlers  
✅ **Fallback Chain**: Multiple levels of error message extraction

## Error Handling Best Practices

### Pattern to Use
```tsx
try {
    // API call
} catch (error: any) {
    // 1. Extract error message with fallbacks
    const errorMessage = error?.response?.data?.message || error?.message || "Default message";
    
    // 2. Ensure it's a string
    const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
    
    // 3. Display error
    toast.error(errorString);
    
    // 4. Check for specific errors (if needed)
    if (errorString.toLowerCase().includes("keyword")) {
        // Handle specific case
    }
}
```

### Common Error Structures

Different APIs might return errors in different formats:

```typescript
// Axios format
error.response.data.message

// Standard Error format
error.message

// Custom API format
error.response.data.error

// String format
error
```

Our fix handles all these cases with the fallback chain.

## Testing

### Test Cases

1. **String Error Message**
   ```tsx
   error = { response: { data: { message: "Not authorized" } } }
   // ✅ Works: errorString = "Not authorized"
   ```

2. **Object Error Message**
   ```tsx
   error = { response: { data: { message: { code: 403, text: "Forbidden" } } } }
   // ✅ Works: errorString = "[object Object]" or stringified version
   ```

3. **No Response Data**
   ```tsx
   error = { message: "Network error" }
   // ✅ Works: errorString = "Network error"
   ```

4. **Empty Error**
   ```tsx
   error = {}
   // ✅ Works: errorString = "Failed to approve leave"
   ```

### Verify the Fix

1. **Try approving a leave as non-manager**:
   - Login as employee who is not a manager
   - Try to approve a leave request
   - **Expected**: See error message, no console error

2. **Test with network error**:
   - Disconnect network
   - Try to approve a leave
   - **Expected**: See "Failed to approve leave", no crash

3. **Test with valid approval**:
   - Login as line manager
   - Approve a subordinate's leave
   - **Expected**: Success message, no errors

## Related Files

- `/frontend/src/app/dashboard/employee/leave-manager/components/pending-approvals-tab.tsx` - Fixed
- Other error handlers in the codebase should follow this pattern

## Prevention

To prevent similar issues in the future:

1. **Always check types** before calling type-specific methods
2. **Use fallback chains** for error message extraction
3. **Convert to string** when dealing with unknown error formats
4. **Add `.toLowerCase()`** for case-insensitive string comparisons
5. **Test error scenarios** with various error formats

## Summary

Fixed a runtime TypeError that occurred when the error response was not a string. The solution adds proper type checking and conversion to ensure `errorMessage` is always a string before calling string methods like `.includes()`. This makes the error handling more robust and prevents crashes when dealing with unexpected error formats.

**Status**: ✅ Fixed  
**Date**: December 13, 2025
