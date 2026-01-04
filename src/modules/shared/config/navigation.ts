import {
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Clock,
  Plane,
  User,
  Users,
  CalendarCheck,
  Mail,
} from "lucide-react";
import type { ComponentType } from "react";

import type { PermissionKey, Role } from "@/lib/auth/types";

export type NavItem = {
  href?: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  roles?: Role[];
  permissions?: PermissionKey[];
  children?: NavItem[];
};

const EMPLOYEE_NAV: NavItem[] = [
  {
    href: "/dashboard/employee",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["employee", "admin", "super-admin"],
    permissions: ["dashboard.view"],
  },
  {
    href: "/dashboard/employee/profile",
    label: "Profile",
    icon: User,
    roles: ["employee", "admin", "super-admin"],
    permissions: ["profile.view"],
  },
  {
    label: "Attendance",
    icon: Clock,
    roles: ["employee", "admin", "super-admin"],
    permissions: ["attendance.view"],
    children: [
      {
        href: "/dashboard/employee/attendance",
        label: "Overview",
        icon: Clock,
        roles: ["employee", "admin", "super-admin"],
        permissions: ["attendance.view"],
      },
      {
        href: "/dashboard/employee/attendance/reconciliation",
        label: "Reconciliation",
        icon: Clock,
        roles: ["employee", "admin", "super-admin"],
        permissions: ["attendance.view"],
      },
    ],
  },
  {
    href: "/dashboard/employee/leave",
    label: "Leave",
    icon: Plane,
    roles: ["employee", "admin", "super-admin"],
    permissions: ["leave.request"],
  },
  {
    href: "/dashboard/employee/leave-manager",
    label: "Team Leave",
    icon: Users,
    roles: ["employee", "admin", "super-admin"],
    permissions: ["leave.request"], // Show to all employees; page will check if they have subordinates
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["admin", "super-admin"],
    permissions: ["dashboard.view"],
  },
  {
    label: "Employees",
    icon: Users,
    roles: ["admin", "super-admin"],
    permissions: ["employees.manage"],
    children: [
      {
        href: "/dashboard/admin/employees",
        label: "All Employees",
        icon: Users,
        roles: ["admin", "super-admin"],
        permissions: ["employees.manage"],
      },
      {
        href: "/dashboard/admin/employees/bulk",
        label: "Bulk Create",
        icon: Users,
        roles: ["admin", "super-admin"],
        permissions: ["employees.manage"],
      },
    ],
  },
  {
    href: "/dashboard/admin/departments",
    label: "Departments",
    icon: Users,
    roles: ["admin", "super-admin"],
    permissions: ["employees.manage"],
  },
  {
    href: "/dashboard/admin/designations",
    label: "Designations",
    icon: Users,
    roles: ["admin", "super-admin"],
    permissions: ["employees.manage"],
  },
  {
    label: "Attendance",
    icon: Clock,
    roles: ["admin", "super-admin"],
    permissions: ["attendance.view"],
    children: [
      {
        href: "/dashboard/admin/attendance",
        label: "Overview",
        icon: Clock,
        roles: ["admin", "super-admin"],
        permissions: ["attendance.view"],
      },
      {
        href: "/dashboard/admin/attendance/reconciliation",
        label: "Reconciliation",
        icon: Clock,
        roles: ["admin", "super-admin"],
        permissions: ["attendance.view"],
      },
    ],
  },
  {
    href: "/dashboard/admin/leave",
    label: "Leave Management",
    icon: CalendarCheck,
    roles: ["admin", "super-admin"],
    permissions: ["leave.approve"],
  },
  {
    href: "/dashboard/admin/communications",
    label: "Communications",
    icon: Mail,
    roles: ["admin", "super-admin"],
  },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  {
    href: "/dashboard/super-admin",
    label: "User Management",
    icon: ShieldCheck,
    roles: ["super-admin"],
    permissions: ["dashboard.view"],
  },
];

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  employee: EMPLOYEE_NAV,
  admin: ADMIN_NAV,
  "super-admin": SUPER_ADMIN_NAV,
};

export function getPrimaryRole(roles: Role[]): Role {
  const priority: Role[] = ["super-admin", "admin", "employee"];
  return priority.find((role) => roles.includes(role)) ?? "employee";
}

export function filterNav(
  items: NavItem[],
  roles: Role[],
  permissions: PermissionKey[]
) {
  return items.filter((item) => {
    const roleAllowed =
      !item.roles || item.roles.some((role) => roles.includes(role));
    const permAllowed =
      !item.permissions ||
      item.permissions.every((perm) => permissions.includes(perm));
    return roleAllowed && permAllowed;
  });
}
