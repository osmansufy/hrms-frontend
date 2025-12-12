import { DASHBOARD_BASE_PATH } from "./constants";
import type { PermissionKey, Role } from "./types";

export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  "super-admin": [
    "dashboard.view",
    "directory.view",
    "profile.view",
    "settings.manage",
    "leave.request",
    "leave.approve",
    "attendance.view",
    "payroll.manage",
    "employees.manage",
  ],
  admin: [
    "dashboard.view",
    "directory.view",
    "profile.view",
    "settings.manage",
    "leave.request",
    "leave.approve",
    "attendance.view",
    "employees.manage",
  ],
  employee: [
    "dashboard.view",
    "directory.view",
    "profile.view",
    "leave.request",
    "attendance.view",
  ],
};

export const ROUTE_ROLE_RULES: Array<{ pattern: RegExp; roles: Role[] }> = [
  {
    pattern: new RegExp(`^${DASHBOARD_BASE_PATH}/super-admin`, "i"),
    roles: ["super-admin"],
  },
  {
    pattern: new RegExp(`^${DASHBOARD_BASE_PATH}/admin`, "i"),
    roles: ["admin", "super-admin"],
  },
  {
    pattern: new RegExp(`^${DASHBOARD_BASE_PATH}/employee`, "i"),
    roles: ["employee", "admin", "super-admin"],
  },
];

export function allowedRolesForPath(pathname: string): Role[] | null {
  const match = ROUTE_ROLE_RULES.find((rule) => rule.pattern.test(pathname));
  return match?.roles ?? null;
}

export function buildPermissions(
  roles: Role[],
  explicit?: PermissionKey[]
): PermissionKey[] {
  const merged = new Set<PermissionKey>(explicit ?? []);

  roles.forEach((role) => {
    ROLE_PERMISSIONS[role]?.forEach((perm) => merged.add(perm));
  });

  return Array.from(merged);
}

export function hasPermission(
  permissions: PermissionKey[],
  required: PermissionKey | PermissionKey[]
) {
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((perm) => permissions.includes(perm));
}
