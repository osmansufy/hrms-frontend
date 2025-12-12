export const ACCESS_TOKEN_COOKIE = "hrms.token";
export const ROLES_COOKIE = "hrms.roles";
export const PERMISSIONS_COOKIE = "hrms.perms";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const DASHBOARD_BASE_PATH = "/dashboard";
export const LOGIN_PATH = "/sign-in";
export const FORBIDDEN_PATH = "/403";

export const ROLE_LOGIN_PATH: Record<import("./types").Role, string> = {
  "super-admin": `${LOGIN_PATH}/super-admin`,
  admin: `${LOGIN_PATH}/admin`,
  employee: `${LOGIN_PATH}/employee`,
};
