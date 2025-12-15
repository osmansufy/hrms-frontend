# Testing the Token Refresh Fix

## Quick Test Instructions

### Test 1: Verify Fix is Active

1. **Start the application:**
   ```bash
   cd /Users/codeentechnologies/Desktop/hrms/frontend
   npm run dev
   ```

2. **Open browser and login:**
   - Go to http://localhost:3000
   - Login with any user credentials

3. **Open DevTools Console:**
   - Press F12 or Cmd+Option+I
   - Go to Console tab

4. **Verify interceptor is loaded:**
   - You should NOT see any errors
   - The app should load normally

### Test 2: Simulate Token Expiration (Quick Test)

**Run this in browser console after logging in:**

```javascript
// Step 1: Check current session
console.log('Current session:', JSON.parse(localStorage.getItem('hrms-session')));

// Step 2: Corrupt the access token to simulate expiration
const session = JSON.parse(localStorage.getItem('hrms-session'));
const oldToken = session.token;
session.token = 'expired-token-simulation';
localStorage.setItem('hrms-session', JSON.stringify(session));
document.cookie = 'hrms.token=expired-token-simulation; path=/; max-age=604800';

console.log('✅ Token corrupted - next API call will trigger refresh');

// Step 3: Navigate to any page or refresh current page
// Watch console for refresh messages
```

**Expected Console Output:**
```
🔄 Access token expired, refreshing...
✅ Token refreshed successfully
```

### Test 3: Verify Token Refresh in Network Tab

1. **After simulating token expiration (Test 2):**
   - Open DevTools → Network tab
   - Filter by "refresh"

2. **Navigate to any dashboard page**

3. **You should see:**
   - POST request to `/api/auth/refresh`
   - Status: 200 OK
   - Response contains new `accessToken` and `refreshToken`

4. **Original request should retry and succeed**

### Test 4: Real Token Expiration (15 minutes)

**For thorough testing:**

1. Login normally
2. Keep browser open
3. Wait 15+ minutes
4. Make any action (click a menu, navigate pages)
5. Watch console - should show token refresh
6. Action should complete successfully

**Note:** This test requires patience but proves the fix works in real conditions.

### Test 5: Multiple Concurrent Requests

**Run this in browser console:**

```javascript
// Simulate multiple API calls at once when token is expired
async function testConcurrentRequests() {
  // First, corrupt token
  const session = JSON.parse(localStorage.getItem('hrms-session'));
  session.token = 'expired-token';
  localStorage.setItem('hrms-session', JSON.stringify(session));
  
  console.log('Making 5 concurrent API calls with expired token...');
  
  // Make multiple API calls simultaneously
  const promises = [
    fetch('/api/leave/balance'),
    fetch('/api/leave/types'),
    fetch('/api/leave'),
    fetch('/api/user/profile'),
    fetch('/api/employees')
  ];
  
  try {
    const results = await Promise.allSettled(promises);
    console.log('Results:', results);
  } catch (error) {
    console.error('Error:', error);
  }
}

testConcurrentRequests();
```

**Expected Behavior:**
- Only ONE refresh request made
- All 5 requests queued
- All 5 requests retry after token refresh
- All 5 requests succeed

---

## Success Criteria

✅ **Test 1:** App loads without errors  
✅ **Test 2:** Token refresh triggered on corrupted token  
✅ **Test 3:** Network shows successful refresh request  
✅ **Test 4:** Real expiration handled seamlessly  
✅ **Test 5:** Concurrent requests handled correctly  

---

## Console Messages Reference

### Normal Operation (No Token Refresh)
- No special messages
- API calls work normally

### Token Refresh (After 15 min or simulated)
```
🔄 Access token expired, refreshing...
✅ Token refreshed successfully
```

### Token Refresh Failed (After 7 days)
```
❌ Token refresh failed: Error: Request failed with status code 401
```
Then redirects to login page.

---

## Troubleshooting

### Issue: No refresh messages in console

**Possible causes:**
1. Token hasn't expired yet (wait 15+ min)
2. Not making API calls
3. Browser cache

**Solution:** Use Test 2 to simulate expiration

### Issue: "No refresh token available"

**Cause:** Old session format (logged in before fix)

**Solution:**
1. Logout: `localStorage.clear()`
2. Login again
3. New session will have refresh token

### Issue: Still getting 401 errors

**Check:**
1. Is `client.ts` properly updated? Check line count: `wc -l src/lib/api/client.ts` should show ~211 lines
2. Did you restart dev server?
3. Clear browser cache and retry

---

## Quick Verification Commands

```bash
# Check if file was updated (should be ~211 lines)
wc -l /Users/codeentechnologies/Desktop/hrms/frontend/src/lib/api/client.ts

# Check for key code additions
grep -n "isRefreshing\|processQueue\|auth/refresh" /Users/codeentechnologies/Desktop/hrms/frontend/src/lib/api/client.ts

# Start dev server
cd /Users/codeentechnologies/Desktop/hrms/frontend && npm run dev
```

---

## Expected File Changes

**Before:**
- `client.ts`: 42 lines
- No interceptor
- No token refresh logic

**After:**
- `client.ts`: 211 lines
- ✅ Response interceptor added
- ✅ Token refresh logic
- ✅ Request queue
- ✅ Error handling

---

## Test Results Template

Use this to document your testing:

```markdown
## Test Results - [Your Name] - [Date]

### Test 1: Basic Functionality
- [ ] App loads without errors
- [ ] Login successful
- [ ] Dashboard loads

### Test 2: Token Simulation
- [ ] Token corruption successful
- [ ] Console shows: "🔄 Access token expired, refreshing..."
- [ ] Console shows: "✅ Token refreshed successfully"
- [ ] Page loads successfully

### Test 3: Network Tab
- [ ] POST /auth/refresh visible
- [ ] Response contains new tokens
- [ ] Original request retried

### Test 4: Real Expiration (15+ min)
- [ ] Waited 15+ minutes
- [ ] Made API call
- [ ] Token refreshed automatically
- [ ] No interruption in UX

### Test 5: Concurrent Requests
- [ ] Multiple requests handled
- [ ] Only one refresh call made
- [ ] All requests succeeded

### Overall Result: ✅ PASS / ❌ FAIL

Notes:
[Add any observations or issues here]
```

---

## Production Deployment Checklist

Before deploying to production:

- [x] Code updated in `client.ts`
- [x] TypeScript compilation successful
- [x] No console errors in dev
- [ ] Tests completed successfully
- [ ] Code reviewed
- [ ] Staging tested
- [ ] Production backup ready
- [ ] Rollback plan prepared

---

**Happy Testing! 🧪**

The fix is ready - now verify it works as expected!
