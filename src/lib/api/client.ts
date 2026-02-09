/**
 * API Client with Token Auto-Refresh Interceptor
 *
 * This file implements automatic JWT token refresh when access tokens expire.
 *
 * Features:
 * - Intercepts 401 responses and automatically refreshes tokens
 * - Queues failed requests and retries them after token refresh
 * - Prevents multiple simultaneous refresh attempts
 * - Automatically logs out user if refresh fails
 *
 * @see SESSION_EXPIRATION_ANALYSIS.md for detailed explanation
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Process all queued requests after token refresh
 * @param error - Error if refresh failed
 * @param token - New access token if refresh succeeded
 */
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

/**
 * Set authorization header for all requests
 * @param token - JWT access token or null to remove
 */
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

/**
 * Response interceptor to handle 401 errors and refresh tokens
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is not 401 or we've already tried refreshing, reject
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Don't retry the refresh endpoint itself or try to refresh on login (no session yet)
    if (
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    // If already tried refreshing this request, reject
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // If refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Mark this request as retried
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Get refresh token from localStorage
      const storedSession = localStorage.getItem("hrms-session");
      if (!storedSession) {
        throw new Error("No session found");
      }

      const session = JSON.parse(storedSession);
      if (!session.refreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("🔄 Access token expired, refreshing...");

      // Call refresh endpoint (don't use apiClient to avoid circular calls)
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: session.refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      console.log("✅ Token refreshed successfully");

      // Update session in localStorage
      const updatedSession = {
        ...session,
        token: accessToken,
        refreshToken: newRefreshToken,
      };
      localStorage.setItem("hrms-session", JSON.stringify(updatedSession));

      // Update cookie
      const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
      if (typeof document !== "undefined") {
        document.cookie = `hrms.token=${encodeURIComponent(
          accessToken
        )}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}`;
      }

      // Update axios default header
      setAuthToken(accessToken);

      // Process all queued requests with new token
      processQueue(null, accessToken);

      // Retry the original request with new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      console.error("❌ Token refresh failed:", refreshError);

      // Process queued requests with error
      processQueue(refreshError, null);

      // Clear session data
      if (typeof window !== "undefined") {
        localStorage.removeItem("hrms-session");
        document.cookie = "hrms.token=; path=/; max-age=0";
        document.cookie = "hrms.roles=; path=/; max-age=0";
        document.cookie = "hrms.perms=; path=/; max-age=0";

        // Redirect to login page
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/sign-in")) {
          window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(
            currentPath
          )}`;
        }
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  data?: unknown;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
};

/**
 * Parse axios error into a standard format with enhanced validation error handling
 * @param error - Unknown error object
 * @returns Normalized error object
 */
export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    // Extract structured error information
    const errorMessage =
      responseData?.message || error.message || "An error occurred";
    const errorCode = responseData?.code || responseData?.errorCode;
    const validationErrors =
      responseData?.validationErrors || responseData?.errors;

    // Handle validation errors array
    if (Array.isArray(validationErrors)) {
      const formattedErrors = validationErrors.map((err: any) => ({
        field: err.field || err.property || "unknown",
        message:
          err.message ||
          err.constraints?.[Object.keys(err.constraints || {})[0]] ||
          "Validation failed",
      }));

      return {
        message: errorMessage,
        status: error.response?.status,
        code: errorCode,
        data: responseData,
        validationErrors: formattedErrors,
      };
    }

    // Handle specific error codes with better messages
    if (errorCode) {
      const enhancedMessage = getEnhancedErrorMessage(
        errorCode,
        errorMessage,
        responseData
      );
      return {
        message: enhancedMessage,
        status: error.response?.status,
        code: errorCode,
        data: responseData,
      };
    }

    return {
      message: errorMessage,
      status: error.response?.status,
      data: responseData,
    };
  }

  return {
    message: error instanceof Error ? error.message : "Unknown error",
  };
}

/**
 * Get enhanced error messages based on error codes
 */
function getEnhancedErrorMessage(
  code: string,
  defaultMessage: string,
  data: any
): string {
  const errorMessages: Record<string, string> = {
    INSUFFICIENT_BALANCE: `Insufficient leave balance: ${
      data?.details || defaultMessage
    }`,
    NOTICE_PERIOD_NOT_MET: `Notice period requirement not met: ${
      data?.details || defaultMessage
    }`,
    OVERLAPPING_LEAVE: `Overlapping leave detected: ${
      data?.details || defaultMessage
    }`,
    INVALID_DATE_RANGE: `Invalid date range: ${
      data?.details || defaultMessage
    }`,
    LEAVE_TYPE_NOT_FOUND: "The selected leave type is not available",
    USER_NOT_FOUND: "User account not found",
    UNAUTHORIZED: "You do not have permission to perform this action",
    VALIDATION_ERROR: "Please check your input and try again",
  };

  return errorMessages[code] || defaultMessage;
}

export function createOpenApiClient() {
  return apiClient;
}
