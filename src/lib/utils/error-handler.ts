/**
 * Extracts a user-friendly error message from various error formats
 * Handles NestJS error responses, Axios errors, and standard Error objects
 */
export function extractErrorMessage(
  error: any,
  fallbackMessage = "An error occurred"
): string {
  // Check for Axios error response
  if (error?.response?.data) {
    const errorData = error.response.data;

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
