/**
 * Generic error handling utilities for API errors
 * Handles NestJS error responses, Axios errors, and standard Error objects
 */

import { toast } from "sonner";
import axios from "axios";

export type ErrorHandlerOptions = {
  /**
   * Default title for error toast
   */
  defaultTitle?: string;
  /**
   * Default fallback message if error cannot be parsed
   */
  defaultMessage?: string;
  /**
   * Duration for error toast (in milliseconds)
   */
  duration?: number;
  /**
   * Custom error code handlers
   */
  codeHandlers?: Record<
    string,
    (error: any, options?: ErrorHandlerOptions) => void
  >;
  /**
   * Custom message pattern handlers (checks if error message contains pattern)
   */
  messagePatternHandlers?: Array<{
    pattern: string | RegExp;
    handler: (error: any, options?: ErrorHandlerOptions) => void;
  }>;
  /**
   * Custom context data to pass to handlers
   */
  context?: Record<string, any>;
  /**
   * Whether to log error to console
   */
  logError?: boolean;
};

/**
 * Extracts error message from various error formats
 * Handles NestJS error responses, Axios errors, and standard Error objects
 */
export function extractErrorMessage(
  error: any,
  fallbackMessage = "An error occurred"
): string {
  // Check for Axios error response
  if (error?.response?.data) {
    const errorData = error.response.data;

    // Handle nested NestJS message structure (message.message)
    if (
      errorData.message?.message &&
      typeof errorData.message.message === "string"
    ) {
      return errorData.message.message;
    }

    // Handle string message
    if (typeof errorData.message === "string") {
      return errorData.message;
    }

    // Handle array of messages (validation errors)
    if (Array.isArray(errorData.message)) {
      return errorData.message.join(", ");
    }

    // Handle object message (shouldn't happen, but be safe)
    if (errorData.message && typeof errorData.message === "object") {
      return JSON.stringify(errorData.message);
    }

    // If no message property, try error property
    if (typeof errorData.error === "string") {
      return errorData.error;
    }
  }

  // Check for standard Error message
  if (error?.message && typeof error.message === "string") {
    return error.message;
  }

  // If error itself is a string
  if (typeof error === "string") {
    return error;
  }

  return fallbackMessage;
}

/**
 * Extracts error code from error response
 */
export function extractErrorCode(error: any): string | undefined {
  if (error?.response?.data) {
    return error.response.data.code || error.response.data.errorCode;
  }
  return undefined;
}

/**
 * Extracts validation errors from error response
 */
export function extractValidationErrors(
  error: any
): Array<{ field: string; message: string }> | null {
  if (error?.response?.data) {
    const errorData = error.response.data;
    const validationErrors = errorData.validationErrors || errorData.errors;

    if (Array.isArray(validationErrors)) {
      return validationErrors.map((err: any) => ({
        field: err.field || err.property || "unknown",
        message:
          err.message ||
          err.constraints?.[Object.keys(err.constraints || {})[0]] ||
          "Validation failed",
      }));
    }
  }
  return null;
}

/**
 * Gets HTTP status code from error
 */
export function extractStatusCode(error: any): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * Enhanced error code to title mapping
 */
const DEFAULT_ERROR_TITLES: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Insufficient leave balance",
  NOTICE_PERIOD_NOT_MET: "Notice period requirement not met",
  OVERLAPPING_LEAVE: "Overlapping leave detected",
  INVALID_DATE_RANGE: "Invalid date range",
  LEAVE_TYPE_NOT_FOUND: "Leave type not found",
  USER_NOT_FOUND: "User not found",
  UNAUTHORIZED: "Permission denied",
  FORBIDDEN: "Access forbidden",
  VALIDATION_ERROR: "Validation error",
  NETWORK_ERROR: "Network error",
};

/**
 * Enhanced error code to message formatter
 */
function formatErrorMessage(
  code: string | undefined,
  message: string,
  errorData: any
): string {
  if (!code) return message;

  const enhancedMessages: Record<string, string> = {
    INSUFFICIENT_BALANCE: errorData?.details || message,
    NOTICE_PERIOD_NOT_MET: errorData?.details || message,
    OVERLAPPING_LEAVE: errorData?.details || message,
    INVALID_DATE_RANGE: errorData?.details || message,
    LEAVE_TYPE_NOT_FOUND: "The selected leave type is not available",
    USER_NOT_FOUND: "User account not found",
    UNAUTHORIZED: "You do not have permission to perform this action",
    FORBIDDEN: "You do not have access to this resource",
    VALIDATION_ERROR: "Please check your input and try again",
  };

  return enhancedMessages[code] || message;
}

/**
 * Generic error handler that shows toast notifications
 *
 * @example
 * ```ts
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   handleApiError(error, {
 *     defaultTitle: "Operation failed",
 *     codeHandlers: {
 *       CUSTOM_CODE: (error) => {
 *         toast.error("Custom error", { description: "Custom message" });
 *       }
 *     }
 *   });
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): void {
  const {
    defaultTitle = "Operation failed",
    defaultMessage = "An unexpected error occurred",
    duration = 5000,
    codeHandlers = {},
    messagePatternHandlers = [],
    context = {},
    logError = true,
  } = options;

  if (logError) {
    console.error("API Error:", error);
  }

  // Check if it's an Axios error
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data;
    const statusCode = error.response?.status;
    const errorCode = extractErrorCode(error);
    const errorMessage = extractErrorMessage(error, defaultMessage);
    const validationErrors = extractValidationErrors(error);

    // Handle validation errors first
    if (validationErrors && validationErrors.length > 0) {
      const validationMessages = validationErrors
        .map((err) => `${err.field}: ${err.message}`)
        .join(", ");
      toast.error("Validation error", {
        description: validationMessages,
        duration,
      });
      return;
    }

    // Check custom message pattern handlers
    for (const { pattern, handler } of messagePatternHandlers) {
      const matches =
        typeof pattern === "string"
          ? errorMessage.toLowerCase().includes(pattern.toLowerCase())
          : pattern.test(errorMessage);
      if (matches) {
        handler(error, { ...options, context });
        return;
      }
    }

    // Handle custom code handlers
    if (errorCode && codeHandlers[errorCode]) {
      codeHandlers[errorCode](error, { ...options, context });
      return;
    }

    // Handle specific status codes
    if (statusCode === 403 || statusCode === 401) {
      toast.error("Permission denied", {
        description: errorMessage,
        duration,
      });
      return;
    }

    if (statusCode === 404) {
      toast.error("Not found", {
        description: errorMessage,
        duration,
      });
      return;
    }

    if (statusCode === 400) {
      const title = errorCode
        ? DEFAULT_ERROR_TITLES[errorCode] || defaultTitle
        : defaultTitle;
      const formattedMessage = errorCode
        ? formatErrorMessage(errorCode, errorMessage, errorData)
        : errorMessage;
      toast.error(title, {
        description: formattedMessage,
        duration,
      });
      return;
    }

    // Handle network errors
    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error")
    ) {
      toast.error("Network error", {
        description: "Please check your internet connection and try again",
        duration: 7000,
      });
      return;
    }

    // Default error handling
    const title = errorCode
      ? DEFAULT_ERROR_TITLES[errorCode] || defaultTitle
      : defaultTitle;
    const formattedMessage = errorCode
      ? formatErrorMessage(errorCode, errorMessage, errorData)
      : errorMessage;

    toast.error(title, {
      description: formattedMessage,
      duration,
    });
    return;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    toast.error(defaultTitle, {
      description: error.message || defaultMessage,
      duration,
    });
    return;
  }

  // Handle string errors
  if (typeof error === "string") {
    toast.error(defaultTitle, {
      description: error,
      duration,
    });
    return;
  }

  // Fallback
  toast.error(defaultTitle, {
    description: defaultMessage,
    duration,
  });
}

/**
 * Pre-configured error handler for leave operations
 */
export function handleLeaveError(
  error: unknown,
  context?: {
    pendingLeaves?: Array<{
      status: string;
      leaveType?: { name: string } | null;
      startDate: string;
      endDate: string;
    }>;
    formatRange?: (start: string, end: string) => string;
  }
): void {
  const { pendingLeaves = [], formatRange } = context || {};

  handleApiError(error, {
    defaultTitle: "Leave operation failed",
    defaultMessage: "Could not complete leave operation",
    codeHandlers: {
      INSUFFICIENT_BALANCE: (error) => {
        const message = extractErrorMessage(error);
        toast.error("Insufficient leave balance", {
          description: message,
        });
      },
      NOTICE_PERIOD_NOT_MET: (error) => {
        const message = extractErrorMessage(error);
        toast.error("Notice period requirement not met", {
          description: message,
        });
      },
      OVERLAPPING_LEAVE: (error) => {
        const message = extractErrorMessage(error);
        toast.error("Overlapping leave detected", {
          description: message,
        });
      },
    },
    messagePatternHandlers: [
      {
        pattern: /pending leave/i,
        handler: (error) => {
          const errorMessage = extractErrorMessage(error);
          let description = errorMessage;

          if (pendingLeaves.length > 0 && formatRange) {
            const pendingLeave = pendingLeaves[0];
            const leaveTypeName = pendingLeave.leaveType?.name || "Leave";
            const dateRange = formatRange(
              pendingLeave.startDate,
              pendingLeave.endDate
            );
            description = `${errorMessage} You have a ${pendingLeave.status.toLowerCase()} ${leaveTypeName} request from ${dateRange}.`;
          }

          toast.error("Pending leave application", {
            description,
            duration: 6000,
          });
        },
      },
    ],
  });
}
