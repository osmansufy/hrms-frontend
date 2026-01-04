export type Role = "super-admin" | "admin" | "employee";

// Raw roles coming from backend/JWT (e.g., Prisma enums) may be uppercase with underscores.
export type RawRole = Role | "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";

export function normalizeRole(role: string): Role | null {
  const normalized = role.toLowerCase().replace(/_/g, "-");
  if (
    normalized === "super-admin" ||
    normalized === "admin" ||
    normalized === "employee"
  ) {
    return normalized as Role;
  }
  return null;
}

export type PermissionKey =
  | "dashboard.view"
  | "directory.view"
  | "profile.view"
  | "settings.manage"
  | "leave.request"
  | "leave.approve"
  | "attendance.view"
  | "payroll.manage"
  | "employees.manage"
  | "communications.send";

export type SessionPayload = {
  sub: string;
  email?: string;
  name?: string;
  // Backend may send enum-style roles (e.g., SUPER_ADMIN); keep RawRole to normalize later.
  roles?: RawRole[];
  permissions?: PermissionKey[];
  exp?: number;
};

export type Session = {
  user: {
    id: string;
    name?: string;
    email?: string;
    roles: Role[];
    permissions: PermissionKey[];
  };
  token: string;
  refreshToken?: string;
};

export type ParsedSession =
  | { authenticated: false; reason?: string }
  | { authenticated: true; session: Session; token: string };
