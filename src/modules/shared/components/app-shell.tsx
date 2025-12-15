"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useSession } from "@/components/auth/session-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE, filterNav, getPrimaryRole } from "@/modules/shared/config/navigation";
import { usePermissions } from "@/modules/shared/hooks/use-permissions";
import { useUIStore } from "@/modules/shared/stores/ui-store";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

export function AppShell({ children, title = "Dashboard" }: AppShellProps) {
  const pathname = usePathname();
  const { permissions, roles } = usePermissions();
  const primaryRole = useMemo(() => getPrimaryRole(roles), [roles]);
  const navItems = useMemo(
    () => filterNav(NAV_BY_ROLE[primaryRole], roles, permissions),
    [permissions, roles, primaryRole],
  );

  return (
    <div className="flex min-h-screen bg-background" suppressHydrationWarning>
      <aside className="hidden w-64 border-r lg:block">
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            HR
          </div>
          <div>
            <div className="text-sm font-semibold">HRMS</div>
            <div className="text-xs text-muted-foreground">Role-aware dashboard</div>
          </div>
        </div>
        <Separator />
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <Header pathname={pathname} title={title} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Header({ pathname, title }: { pathname: string; title: string }) {
  const subtitle = useMemo(() => {
    if (pathname === "/") {
      return title;
    }
    return pathname
      .replace("/dashboard/", "")
      .replaceAll("-", " ")
      .replaceAll("/", " · ");
  }, [pathname, title]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div>
          <p className="text-sm font-semibold leading-none">{title}</p>
          <p className="text-xs text-muted-foreground capitalize">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="notifications">
          <Bell className="size-5" />
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const { permissions, roles } = usePermissions();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();
  const primaryRole = useMemo(() => getPrimaryRole(roles), [roles]);
  const navItems = useMemo(
    () => filterNav(NAV_BY_ROLE[primaryRole], roles, permissions),
    [permissions, roles, primaryRole],
  );

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="outline" size="icon" aria-label="Toggle navigation" onClick={toggleSidebar}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex items-center gap-3 px-1">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            HR
          </div>
          <div>
            <div className="text-sm font-semibold">HRMS</div>
            <div className="text-xs text-muted-foreground">Role-aware dashboard</div>
          </div>
        </div>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function UserMenu() {
  const { session, signOut } = useSession();
  const initials = session?.user.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const primaryRole = session?.user.roles?.[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="size-9">
            <AvatarFallback>{initials || "HR"}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-semibold leading-tight">
              {session?.user.name || "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">{primaryRole || "Viewer"}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-none">
              {session?.user.name || "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">{session?.user.email}</p>
            <Badge variant="secondary" className="mt-2">
              {session?.user.roles.join(", ") || "Viewer"}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/employee/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/admin/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={signOut}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
