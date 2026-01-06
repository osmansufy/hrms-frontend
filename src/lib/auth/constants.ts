/**
 * Authentication and Session Constants
 *
 * Centralized configuration for session management and cookie settings.
 */

export const ACCESS_TOKEN_COOKIE = "hrms.token";
export const ROLES_COOKIE = "hrms.roles";
export const PERMISSIONS_COOKIE = "hrms.perms";

/**
 * Session cookie max age in seconds
 * Default: 7 days (604,800 seconds)
 * Can be overridden via NEXT_PUBLIC_SESSION_MAX_AGE environment variable
 *
 * Examples:
 * - 30 days: 2592000
 * - 14 days: 1209600
 * - 7 days: 604800 (default)
 * - 1 day: 86400
 */
export const SESSION_MAX_AGE_SECONDS = process.env.NEXT_PUBLIC_SESSION_MAX_AGE
  ? parseInt(process.env.NEXT_PUBLIC_SESSION_MAX_AGE, 10)
  : 60 * 60 * 24 * 7; // 7 days

export const DASHBOARD_BASE_PATH = "/dashboard";
export const LOGIN_PATH = "/sign-in";
export const FORBIDDEN_PATH = "/403";

export const ROLE_LOGIN_PATH: Record<import("./types").Role, string> = {
  "super-admin": `${LOGIN_PATH}/super-admin`,
  admin: `${LOGIN_PATH}/admin`,
  employee: `${LOGIN_PATH}/employee`,
};
