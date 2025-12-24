"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/lib/auth/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

const roleLabels: Record<Role, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  employee: "Member",
};

const roleHomes: Record<Role, string> = {
  "super-admin": "/dashboard/super-admin",
  admin: "/dashboard/admin",
  employee: "/dashboard/employee",
};

function normalizeRole(roleParam?: string): Role {
  const normalized = roleParam?.toLowerCase() ?? "";
  if (normalized.includes("super")) return "super-admin";
  if (normalized === "admin") return "admin";
  if (normalized === "member") return "employee";
  return "employee";
}

function pickRoleHome(roles: Role[] | undefined, fallback: Role): string {
  const priority: Role[] = ["super-admin", "admin", "employee"];
  const preferred = priority.find((role) => roles?.includes(role));
  return roleHomes[preferred ?? fallback];
}

export function SignInView({
  roleParam,
  callbackUrl,
}: {
  roleParam?: string;
  callbackUrl?: string;
}) {
  const role = useMemo(() => normalizeRole(roleParam), [roleParam]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signIn, status, session } = useSession();

  const sessionRolesKey = session?.user.roles?.join(",") ?? "";

  useEffect(() => {
    if (status !== "authenticated") return;
    const redirectTo = callbackUrl || pickRoleHome(session?.user.roles, role);
    router.replace(redirectTo);
  }, [status, sessionRolesKey, router, callbackUrl, role]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const roles = await signIn(values);
      const wantsAdmin = role === "admin" || role === "super-admin";
      const isAdminRole = roles.includes("admin") || roles.includes("super-admin");
      console.log({
        roles,
        wantsAdmin,
        isAdminRole,
      });
      if (wantsAdmin && !isAdminRole) {
        toast.error("You are not authorized to access the Admin Portal.");

      }

      const redirectTo = callbackUrl || pickRoleHome(roles, role);
      toast.success("Welcome back");
      router.push(redirectTo);
    } catch (error) {
      const message = error instanceof Error && error.message === "invalid-credentials"
        ? "Invalid email or password"
        : "Unable to sign in";
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isMemberAlias = roleParam?.toLowerCase() === "member";
  const titleLabel = isMemberAlias ? "Member" : roleLabels[role] || "HRMS";
  const title = `Sign in as ${titleLabel}`;
  const description =
    role === "employee"
      ? "Access your member workspace."
      : `Access the ${titleLabel} console.`;

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@company.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="mr-2 size-4" />
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Choose a console:</p>
          <div className="flex flex-wrap gap-2">
            <Link className="font-semibold text-primary" href="/sign-in/member">
              Member
            </Link>
            <span>·</span>
            <Link className="font-semibold text-primary" href="/sign-in/admin">
              Admin
            </Link>
            <span>·</span>
            <Link className="font-semibold text-primary" href="/sign-in/super-admin">
              Super Admin
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
