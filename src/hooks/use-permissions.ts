"use client";

import { useMemo } from "react";

import { useSession } from "@/components/auth/session-provider";
import { hasPermission } from "@/lib/auth/permissions";
import type { PermissionKey, Role } from "@/lib/auth/types";

export function usePermissions() {
  const { session } = useSession();

  const checker = useMemo(() => {
    const roles = session?.user.roles ?? [];
    const permissions = session?.user.permissions ?? [];

    return {
      has(required: PermissionKey | PermissionKey[]) {
        return hasPermission(permissions, required);
      },
      roles,
      permissions,
    };
  }, [session?.user.permissions, session?.user.roles]);

  return checker;
}

export function useHasPermission(required: PermissionKey | PermissionKey[]) {
  const { permissions } = usePermissions();
  return hasPermission(permissions, required);
}

export function useRoleGuard(allowedRoles: Role[]) {
  const { roles } = usePermissions();
  return roles.some((role) => allowedRoles.includes(role));
}
