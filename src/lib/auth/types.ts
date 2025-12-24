export type Role = "super-admin" | "admin" | "employee";

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
  roles?: Role[];
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
