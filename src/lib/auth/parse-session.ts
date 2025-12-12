import { NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  PERMISSIONS_COOKIE,
  ROLES_COOKIE,
} from "./constants";
import { allowedRolesForPath, buildPermissions } from "./permissions";
import { verifyToken } from "./token";
import type {
  ParsedSession,
  PermissionKey,
  Role,
  SessionPayload,
} from "./types";

function readCookieArray(req: NextRequest, key: string): string[] {
  const value = req.cookies.get(key)?.value;
  if (!value) return [];
  return value.split(",").map((v) => decodeURIComponent(v));
}

function normalizeRoles(payload: SessionPayload, req: NextRequest): Role[] {
  const rolesFromCookie = readCookieArray(req, ROLES_COOKIE) as Role[];
  return payload.roles?.length ? payload.roles : rolesFromCookie;
}

function normalizePermissions(
  payload: SessionPayload,
  roles: Role[],
  req: NextRequest
) {
  const permFromCookie = readCookieArray(
    req,
    PERMISSIONS_COOKIE
  ) as PermissionKey[];
  return buildPermissions(roles, payload.permissions ?? permFromCookie);
}

export async function parseSession(req: NextRequest): Promise<ParsedSession> {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return { authenticated: false, reason: "missing-token" };
  }

  const verification = await verifyToken(token);
  if (!verification.valid) {
    return { authenticated: false, reason: verification.reason };
  }

  const roles = normalizeRoles(verification.payload, req);
  if (!roles.length) {
    return { authenticated: false, reason: "missing-roles" };
  }

  const permissions = normalizePermissions(verification.payload, roles, req);
  const userId = verification.payload.sub || "anonymous";

  return {
    authenticated: true,
    token,
    session: {
      user: {
        id: userId,
        name: verification.payload.name,
        email: verification.payload.email,
        roles,
        permissions,
      },
      token,
    },
  };
}

export function getAllowedRolesForPath(pathname: string) {
  return allowedRolesForPath(pathname);
}
