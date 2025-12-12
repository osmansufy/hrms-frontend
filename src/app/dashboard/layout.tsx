"use client";

import { Protected } from "@/components/auth/protected";
import { AppShell } from "@/modules/shared/components/app-shell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Protected>
      <AppShell title="Dashboard">{children}</AppShell>
    </Protected>
  );
}
