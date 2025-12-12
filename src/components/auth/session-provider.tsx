"use client";

import { AxiosError } from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { apiClient, setAuthToken } from "@/lib/api/client";
import {
  ACCESS_TOKEN_COOKIE,
  PERMISSIONS_COOKIE,
  ROLES_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { buildPermissions } from "@/lib/auth/permissions";
import type { Role, Session } from "@/lib/auth/types";
import { verifyToken } from "@/lib/auth/token";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type Credentials = {
  email: string;
  password: string;
  name?: string;
};

type SessionContextValue = {
  session: Session | null;
  status: AuthStatus;
  signIn: (credentials: Credentials) => Promise<Role[]>;
  signUp: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = "hrms-session";

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const getStoredSession = () => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Session & { user: { role?: string } };
    if (parsed.user && !parsed.user.roles) {
      const role = parsed.user.role ? ([parsed.user.role] as Role[]) : [];
      parsed.user.roles = role;
      parsed.user.permissions = buildPermissions(role);
    } else if (parsed.user?.roles) {
      parsed.user.permissions = buildPermissions(parsed.user.roles, parsed.user.permissions);
    }
    return parsed as Session;
  } catch (error) {
    console.error("Failed to parse stored session", error);
    return null;
  }
};

function pickRole(email: string): Role {
  if (email.includes("super")) return "super-admin";
  if (email.includes("admin")) return "admin";
  return "employee";
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => getStoredSession());
  const [status, setStatus] = useState<AuthStatus>(() =>
    getStoredSession() ? "authenticated" : "unauthenticated",
  );

  useEffect(() => {
    if (session?.token) {
      setAuthToken(session.token);
      setCookie(ACCESS_TOKEN_COOKIE, session.token);
      setCookie(ROLES_COOKIE, session.user.roles.join(","));
      setCookie(PERMISSIONS_COOKIE, session.user.permissions.join(","));
    } else {
      setAuthToken(null);
      clearCookie(ACCESS_TOKEN_COOKIE);
      clearCookie(ROLES_COOKIE);
      clearCookie(PERMISSIONS_COOKIE);
    }
  }, [session]);

  const persistSession = (nextSession: Session) => {
    setSession(nextSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setAuthToken(nextSession.token);
    setStatus("authenticated");
    setCookie(ACCESS_TOKEN_COOKIE, nextSession.token);
    setCookie(ROLES_COOKIE, nextSession.user.roles.join(","));
    setCookie(PERMISSIONS_COOKIE, nextSession.user.permissions.join(","));
  };

  const signIn = async ({ email, password }: Credentials) => {
    let res;
    try {
      res = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        "/auth/login",
        { email, password },
      );
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 401) {
        throw new Error("invalid-credentials");
      }
      throw err;
    }

    const token = res.data.accessToken;
    const parsed = await verifyToken(token);
    const payload = parsed.valid ? parsed.payload : undefined;

    const rolesFromToken =
      payload?.roles
        ?.map((role) => role.toLowerCase().replace("_", "-"))
        .filter((role): role is Role => ["super-admin", "admin", "employee"].includes(role)) || [];

    const role = rolesFromToken[0] ?? pickRole(email);
    const permissions = buildPermissions(rolesFromToken.length ? rolesFromToken : [role]);

    const resolvedRoles = rolesFromToken.length ? rolesFromToken : [role];

    persistSession({
      user: {
        id: payload?.sub || "user-1",
        name: payload?.name || email.split("@")[0] || "HR User",
        email: payload?.email || email,
        roles: resolvedRoles,
        permissions,
        title: "People Operations",
      },
      token,
      refreshToken: res.data.refreshToken,
    });

    return resolvedRoles;
  };

  const signUp = async ({ email, name }: Credentials) => {
    // Backend does not expose a public sign-up; keep mock for now
    await new Promise((resolve) => setTimeout(resolve, 300));
    const role = pickRole(email);
    const permissions = buildPermissions([role]);

    persistSession({
      user: {
        id: "user-2",
        name: name || "New User",
        email,
        roles: [role],
        permissions,
      },
      token: "mock-token",
    });
  };

  const signOut = async () => {
    try {
      if (session?.refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken: session.refreshToken });
      } else {
        await apiClient.post("/auth/logout");
      }
    } catch (error) {
      // Ignore logout failures; proceed to clear local session
      console.warn("Logout request failed", error);
    } finally {
      setSession(null);
      setStatus("unauthenticated");
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
      clearCookie(ACCESS_TOKEN_COOKIE);
      clearCookie(ROLES_COOKIE);
      clearCookie(PERMISSIONS_COOKIE);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        status,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
