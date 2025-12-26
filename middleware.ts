import { NextResponse, type NextRequest } from "next/server";

import {
  DASHBOARD_BASE_PATH,
  FORBIDDEN_PATH,
  LOGIN_PATH,
  ROLE_LOGIN_PATH,
} from "@/lib/auth/constants";
import { getAllowedRolesForPath, parseSession } from "@/lib/auth/parse-session";
import type { Role } from "@/lib/auth/types";

const roleRedirects: Record<Role, string> = {
  "super-admin": `${DASHBOARD_BASE_PATH}/super-admin`,
  admin: `${DASHBOARD_BASE_PATH}/admin`,
  employee: `${DASHBOARD_BASE_PATH}/employee`,
};

function resolveLoginPath(pathname: string) {
  const allowedRoles = getAllowedRolesForPath(pathname);
  if (!allowedRoles || !allowedRoles.length) return LOGIN_PATH;
  const preferred = allowedRoles.find((role) => ROLE_LOGIN_PATH[role]);
  return preferred ? ROLE_LOGIN_PATH[preferred] : LOGIN_PATH;
}

function redirectToLogin(req: NextRequest) {
  const loginPath = resolveLoginPath(req.nextUrl.pathname);
  const loginUrl = new URL(loginPath, req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function redirectToForbidden(req: NextRequest) {
  return NextResponse.redirect(new URL(FORBIDDEN_PATH, req.url));
}

function redirectToRoleHome(req: NextRequest, roles: Role[]) {
  console.log("Redirecting to role home for roles:", roles);
  const preferred = roles.find((role) => roleRedirects[role]);
  if (!preferred) return redirectToForbidden(req);
  return NextResponse.redirect(new URL(roleRedirects[preferred], req.url));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith(DASHBOARD_BASE_PATH)) {
    return NextResponse.next();
  }

  const session = await parseSession(req);
  if (!session.authenticated) {
    return redirectToLogin(req);
  }

  const allowedRoles = getAllowedRolesForPath(pathname);
  const userRoles = session.session.user.roles;
  console.log({ userRoles });
  if (!allowedRoles) {
    // Unknown dashboard segment — send to a safe default
    return redirectToRoleHome(req, userRoles);
  }

  const authorized = userRoles.some((role: Role) =>
    allowedRoles.includes(role)
  );
  if (!authorized) {
    return redirectToRoleHome(req, userRoles);
  }

  // Forward user metadata for server components / API routes
  const headers = new Headers(req.headers);
  headers.set("x-user-id", session.session.user.id);
  headers.set("x-user-roles", session.session.user.roles.join(","));
  headers.set("x-user-permissions", session.session.user.permissions.join(","));

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
