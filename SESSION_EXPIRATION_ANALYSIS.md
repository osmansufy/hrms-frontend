# Frontend Session Expiration - Root Cause Analysis & Solution

**Date:** December 14, 2025  
**Status:** 🔴 **ISSUE IDENTIFIED** - Token refresh mechanism not implemented

---

## 🚨 Problem Summary

**Users are being logged out automatically after ~15 minutes of activity.**

This happens because:
1. ✅ Backend issues **access tokens** that expire in **15 minutes** (`ACCESS_TOKEN_TTL = "15m"`)
2. ✅ Backend issues **refresh tokens** that expire in **7 days** (`REFRESH_TOKEN_TTL = "7d"`)
3. ❌ **Frontend does NOT automatically refresh the access token when it expires**
4. ❌ **No axios interceptor to handle 401 errors and refresh tokens**

---

## 🔍 Root Cause Analysis

### Backend Token Configuration

**File:** `backend/src/auth/auth.service.ts` (Line 18-19)

```typescript
const ACCESS_TOKEN_TTL = "15m";      // ⏰ Access token expires in 15 minutes
const REFRESH_TOKEN_TTL = "7d";      // ⏰ Refresh token expires in 7 days
```

**What the backend provides:**
```json
{
  "accessToken": "eyJhbGc...",     // Valid for 15 minutes
  "refreshToken": "eyJhbGc..."     // Valid for 7 days
}
```

### Frontend Session Storage

**File:** `frontend/src/components/auth/session-provider.tsx`

**What the frontend stores:**
```typescript
persistSession({
  user: { id, name, email, roles, permissions },
  token: res.data.accessToken,           // ✅ Stored
  refreshToken: res.data.refreshToken,   // ✅ Stored but NEVER USED
});
```

**Cookie configuration:**
```typescript
// File: frontend/src/lib/auth/constants.ts
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Cookies set with 7-day expiry:
setCookie(ACCESS_TOKEN_COOKIE, session.token);  // ❌ But token expires in 15min!
```

**The Problem:**
- Cookie says: "Valid for 7 days" ✅
- Token inside cookie says: "Valid for 15 minutes" ⏰
- After 15 minutes: Token expires → API calls fail → User logged out ❌

---

## 🔄 Token Lifecycle Flow

### Current (Broken) Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Logs In                                             │
│    POST /auth/login                                         │
│    ↓                                                        │
│    Backend returns:                                         │
│    - accessToken (15min)                                    │
│    - refreshToken (7days)                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend Stores Tokens                                   │
│    - localStorage: Both tokens                              │
│    - Cookie: accessToken (with 7-day max-age)              │
│    - apiClient header: Bearer {accessToken}                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User Makes API Calls (0-15 minutes)                     │
│    ✅ Works fine                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. After 15 Minutes - Token Expires                        │
│    User makes API call                                      │
│    ↓                                                        │
│    Backend: 401 Unauthorized (token expired)               │
│    ↓                                                        │
│    Frontend: ❌ NO INTERCEPTOR TO HANDLE THIS              │
│    ↓                                                        │
│    Result: User sees error / logged out                    │
└─────────────────────────────────────────────────────────────┘
```

### Expected (Correct) Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Logs In                                             │
│    (Same as above)                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend Stores Tokens                                   │
│    (Same as above)                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User Makes API Calls (0-15 minutes)                     │
│    ✅ Works fine                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. After 15 Minutes - Token Expires                        │
│    User makes API call                                      │
│    ↓                                                        │
│    Backend: 401 Unauthorized (token expired)               │
│    ↓                                                        │
│    Frontend Interceptor: ✅ CATCHES 401                    │
│    ↓                                                        │
│    Calls: POST /auth/refresh with refreshToken             │
│    ↓                                                        │
│    Backend returns NEW tokens                               │
│    ↓                                                        │
│    Frontend: Updates tokens in storage/cookie              │
│    ↓                                                        │
│    Retries original API call with new token                │
│    ↓                                                        │
│    Result: ✅ Seamless - User doesn't notice anything      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Continues for 7 days (refresh token lifetime)           │
│    Each 15 minutes: Auto-refresh happens                   │
│    After 7 days: Refresh token expires → User must login   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Current Code Issues

### Issue #1: No Token Refresh Implementation

**File:** `frontend/src/components/auth/session-provider.tsx`

```typescript
// ❌ refreshToken is stored but NEVER USED
persistSession({
  user: {...},
  token: res.data.accessToken,
  refreshToken: res.data.refreshToken,  // Stored but not used anywhere!
});
```

**Missing function:**
```typescript
// ❌ This function doesn't exist!
async function refreshAccessToken() {
  // Should call POST /auth/refresh
  // Should update tokens in storage
}
```

### Issue #2: No Axios Interceptor

**File:** `frontend/src/lib/api/client.ts`

```typescript
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

// ❌ No response interceptor to handle 401 errors!
// ❌ No request interceptor to check token expiry!
```

**What's missing:**
```typescript
// ❌ This interceptor doesn't exist!
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Should refresh token and retry request
    }
    return Promise.reject(error);
  }
);
```

### Issue #3: Token Expiry Not Checked

**File:** `frontend/src/lib/auth/token.ts` (Line 77)

```typescript
// ✅ Token expiry IS checked
if (payload.exp && Date.now() / 1000 > payload.exp) {
  return { valid: false, reason: "token-expired", payload };
}

// ❌ But this is only used in middleware, not in API calls
// ❌ No proactive refresh before token expires
```

---

## ✅ Solution: Implement Token Auto-Refresh

### Solution Overview

We need to add:
1. **Axios response interceptor** - Catch 401 errors and refresh token
2. **Refresh token function** - Call `/auth/refresh` endpoint
3. **Request queue** - Retry failed requests after refresh
4. **Update session provider** - Expose refresh function

### Implementation Plan

#### Step 1: Add Refresh Token Interceptor

**File:** `frontend/src/lib/api/client.ts`

```typescript
import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

// Response interceptor to handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from storage
        const storedSession = localStorage.getItem("hrms-session");
        if (!storedSession) {
          throw new Error("No refresh token available");
        }

        const session = JSON.parse(storedSession);
        if (!session.refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: session.refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens in storage
        const updatedSession = {
          ...session,
          token: accessToken,
          refreshToken: newRefreshToken,
        };
        localStorage.setItem("hrms-session", JSON.stringify(updatedSession));
        
        // Update cookie
        document.cookie = `hrms.token=${encodeURIComponent(accessToken)}; path=/; max-age=${60 * 60 * 24 * 7}`;

        // Update axios default header
        setAuthToken(accessToken);

        // Process queued requests
        processQueue(null, accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Refresh failed - logout user
        localStorage.removeItem("hrms-session");
        document.cookie = "hrms.token=; path=/; max-age=0";
        document.cookie = "hrms.roles=; path=/; max-age=0";
        document.cookie = "hrms.perms=; path=/; max-age=0";
        
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export type ApiError = {
  message: string;
  status?: number;
  data?: unknown;
};

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }

  return {
    message: error instanceof Error ? error.message : "Unknown error",
  };
}

export function createOpenApiClient() {
  return apiClient;
}
```

#### Step 2: Update Session Provider (Optional Enhancement)

**File:** `frontend/src/components/auth/session-provider.tsx`

Add a refresh function to context:

```typescript
type SessionContextValue = {
  session: Session | null;
  status: AuthStatus;
  signIn: (credentials: Credentials) => Promise<Role[]>;
  signUp: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;  // ✅ NEW
};

// Inside SessionProvider component:
const refreshSession = async () => {
  if (!session?.refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const res = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      { refreshToken: session.refreshToken }
    );

    const updatedSession = {
      ...session,
      token: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    };

    persistSession(updatedSession);
  } catch (error) {
    // Refresh failed - logout
    await signOut();
    throw error;
  }
};
```

#### Step 3: Proactive Token Refresh (Advanced)

Add a timer to refresh token before it expires:

```typescript
// Inside SessionProvider component:
useEffect(() => {
  if (!session?.token) return;

  // Decode token to get expiry
  const decoded = verifyToken(session.token);
  if (!decoded.valid || !decoded.payload?.exp) return;

  const expiresAt = decoded.payload.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;

  // Refresh 2 minutes before expiry
  const refreshAt = timeUntilExpiry - 2 * 60 * 1000;

  if (refreshAt > 0) {
    const timeoutId = setTimeout(() => {
      refreshSession();
    }, refreshAt);

    return () => clearTimeout(timeoutId);
  }
}, [session?.token]);
```

---

## 📊 Comparison: Before vs After

### Before (Current)

| Time     | Event                        | Result                |
|----------|------------------------------|-----------------------|
| 0:00     | User logs in                 | ✅ Success            |
| 5:00     | API call                     | ✅ Success            |
| 10:00    | API call                     | ✅ Success            |
| 15:00    | API call                     | ❌ 401 Unauthorized   |
| 15:01    | User logged out              | ❌ Bad UX             |

### After (With Auto-Refresh)

| Time     | Event                        | Result                           |
|----------|------------------------------|----------------------------------|
| 0:00     | User logs in                 | ✅ Success                       |
| 5:00     | API call                     | ✅ Success                       |
| 10:00    | API call                     | ✅ Success                       |
| 13:00    | Proactive refresh            | ✅ Token refreshed automatically |
| 15:00    | API call                     | ✅ Success (new token)           |
| 28:00    | Proactive refresh            | ✅ Token refreshed automatically |
| 30:00    | API call                     | ✅ Success (new token)           |
| ...      | Continues for 7 days         | ✅ Seamless experience           |
| 7 days   | Refresh token expires        | User must login again            |

---

## 🎯 Benefits of Token Auto-Refresh

### 1. **Better User Experience**
- ✅ Users stay logged in for 7 days (not 15 minutes)
- ✅ No unexpected logouts during work
- ✅ Seamless token refresh in background

### 2. **Security**
- ✅ Short-lived access tokens (15min) - reduces attack window
- ✅ Long-lived refresh tokens (7days) - good UX
- ✅ Refresh token rotation - backend invalidates old refresh tokens

### 3. **Industry Standard**
- ✅ OAuth 2.0 standard flow
- ✅ Used by Google, Facebook, GitHub, etc.
- ✅ Recommended by OWASP

---

## 🚀 Implementation Steps

### Immediate Fix (Required)

1. **Update `frontend/src/lib/api/client.ts`**
   - Add response interceptor for 401 errors
   - Implement token refresh logic
   - Add request queue for retry mechanism

### Optional Enhancements

2. **Update `frontend/src/components/auth/session-provider.tsx`**
   - Add `refreshSession` function to context
   - Add proactive refresh timer (refresh before expiry)

3. **Add Error Handling**
   - Show user-friendly message if refresh fails
   - Redirect to login page gracefully
   - Clear all auth data on refresh failure

### Testing Checklist

- [ ] User logs in successfully
- [ ] API calls work for first 15 minutes
- [ ] After 15 minutes, token auto-refreshes on 401
- [ ] Original request retries automatically
- [ ] Multiple concurrent requests handled correctly
- [ ] Refresh failure logs user out gracefully
- [ ] After 7 days, user must login again

---

## 📝 Backend Token Refresh Endpoint

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // New 15min token
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // New 7day token
}
```

**Backend Implementation:** ✅ Already implemented in `backend/src/auth/auth.service.ts`

```typescript
async refresh(dto: RefreshTokenDto) {
  // Verify refresh token
  // Delete old refresh token
  // Generate new access + refresh tokens
  // Store new refresh token
  // Return both tokens
}
```

---

## 🔧 Alternative Solutions (Not Recommended)

### Option 1: Increase Access Token TTL
```typescript
// ❌ NOT RECOMMENDED - Security risk
const ACCESS_TOKEN_TTL = "7d"; // Instead of "15m"
```

**Problems:**
- ❌ Long-lived access tokens are security risk
- ❌ If token is compromised, attacker has 7 days access
- ❌ Can't revoke active sessions easily

### Option 2: Remove Token Expiry
```typescript
// ❌ VERY BAD - Never do this
const ACCESS_TOKEN_TTL = "100y";
```

**Problems:**
- ❌ Huge security vulnerability
- ❌ Tokens never expire
- ❌ No way to force logout

### Option 3: Use Session-Based Auth Instead
```typescript
// ❌ Requires major architecture change
// Use cookies with session IDs instead of JWT
```

**Problems:**
- ❌ Requires complete rewrite
- ❌ Doesn't work well with mobile apps
- ❌ Backend already uses JWT

---

## ✅ Recommended Solution: Implement Token Auto-Refresh

**Implementation Time:** ~2 hours  
**Difficulty:** Medium  
**Benefits:** High  
**Security:** ✅ Maintains security  
**UX:** ✅ Seamless experience

---

## 📚 Additional Resources

- [OAuth 2.0 Token Refresh](https://oauth.net/2/grant-types/refresh-token/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Axios Interceptors Documentation](https://axios-http.com/docs/interceptors)

---

**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Priority:** 🔴 **HIGH** - Affects all users  
**Impact:** User experience significantly improved

---

## 🎉 Summary

**Why sessions expire:**
- Backend issues 15-minute access tokens ✅
- Frontend doesn't refresh tokens automatically ❌

**Solution:**
- Add axios interceptor to catch 401 errors ✅
- Call `/auth/refresh` endpoint automatically ✅
- Retry failed requests with new token ✅

**Result:**
- Users stay logged in for 7 days (not 15 minutes) ✅
- Seamless auto-refresh in background ✅
- Better security + better UX ✅
