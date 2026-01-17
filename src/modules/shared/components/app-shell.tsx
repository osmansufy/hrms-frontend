"use client";

import { Bell, LogOut, Menu, KeyRound, User, Settings, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
import { useSubordinatesLeaves, usePendingHRApprovals, useAmendments } from "@/lib/queries/leave";
import { useAttendanceReconciliationRequests } from "@/lib/queries/attendance";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

export function AppShell({ children, title = "Dashboard" }: AppShellProps) {
  const pathname = usePathname();
  const { permissions, roles } = usePermissions();
  const primaryRole = useMemo(() => getPrimaryRole(roles), [roles]);
  const { data: subordinatesData } = useSubordinatesLeaves();
  const hasSubordinates = useMemo(() => {
    return subordinatesData && subordinatesData.length > 0;
  }, [subordinatesData]);

  const navItems = useMemo(() => {
    const filtered = filterNav(NAV_BY_ROLE[primaryRole], roles, permissions);
    // Hide Team Leave if user has no subordinates
    return filtered.filter(item => {
      if (item.href === "/dashboard/employee/leave-manager") {
        return hasSubordinates;
      }
      return true;
    });
  }, [permissions, roles, primaryRole, hasSubordinates]);
  // If you're using any dynamic data, ensure it's initialized consistently
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, []);

  // For browser-only content, wait until mounted
  if (!mounted) {
    return null // or a skeleton loader
  }
  return (
    <div className="flex min-h-screen bg-background">
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
          {navItems.map((item) =>
            item.children ? (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  {item.icon && <item.icon className="size-4 mr-1" />} {item.label}
                </div>
                <div className="ml-4 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const active = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href!}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {ChildIcon && <ChildIcon className="size-4" />}
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.icon && <item.icon className="size-4" />}
                {item.label}
              </Link>
            )
          )}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <Header pathname={pathname ?? ""} title={title} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Header({ pathname, title }: { pathname: string; title: string }) {
  const { roles } = usePermissions();
  const { data: pendingApprovals } = usePendingHRApprovals();
  const { data: amendments } = useAmendments();
  const { data: reconciliationRequests } = useAttendanceReconciliationRequests();
  const isAdmin = roles.includes("admin") || roles.includes("super-admin");
  const pendingCount = pendingApprovals?.length ?? 0;
  const pendingAmendments = amendments?.filter((amendment) => 
    amendment.status === "PENDING" || amendment.status === "PROCESSING"
  ) ?? [];
  const amendmentCount = pendingAmendments.length;
  const pendingReconciliations = reconciliationRequests?.filter((request) => 
    request.status === "PENDING"
  ) ?? [];
  const reconciliationCount = pendingReconciliations.length;

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
        <NotificationMenu 
          isAdmin={isAdmin} 
          pendingCount={pendingCount} 
          amendmentCount={amendmentCount}
          reconciliationCount={reconciliationCount}
        />
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
  const { data: subordinatesData } = useSubordinatesLeaves();
  const hasSubordinates = useMemo(() => {
    return subordinatesData && subordinatesData.length > 0;
  }, [subordinatesData]);

  const navItems = useMemo(() => {
    const filtered = filterNav(NAV_BY_ROLE[primaryRole], roles, permissions);
    // Filter to only include items with href (exclude parent items with children)
    // and hide Team Leave if user has no subordinates
    return filtered.filter(item => {
      if (!item.href) {
        return false;
      }
      if (item.href === "/dashboard/employee/team-manage") {
        return hasSubordinates;
      }
      return true;
    });
  }, [permissions, roles, primaryRole, hasSubordinates]);

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
                href={item?.href || "#"}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {Icon && <Icon className="size-4" />}
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
          <Link href="/dashboard/employee/profile">
            {/* profile icon */}
            <User className="mr-2 size-4" />
            Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/employee/settings/password">
            <KeyRound className="mr-2 size-4" />
            Change Password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/admin/settings">
            <Settings className="mr-2 size-4" />
            Settings</Link>
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

function NotificationMenu({ 
  isAdmin, 
  pendingCount, 
  amendmentCount,
  reconciliationCount
}: { 
  isAdmin: boolean; 
  pendingCount: number;
  amendmentCount: number;
  reconciliationCount: number;
}) {
  const totalNotifications = pendingCount + amendmentCount + reconciliationCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="notifications" className="relative">
          <Bell className="size-5" />
          {isAdmin && totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {totalNotifications > 99 ? "99+" : totalNotifications}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/leave?tab=approvals" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Bell className="size-4" />
                  <div>
                    <p className="text-sm font-medium">Pending Leave Approvals</p>
                    <p className="text-xs text-muted-foreground">
                      {pendingCount === 0 
                        ? "No pending approvals" 
                        : `${pendingCount} leave request${pendingCount > 1 ? "s" : ""} awaiting approval`
                      }
                    </p>
                  </div>
                </div>
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/leave?tab=amendments" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Bell className="size-4" />
                  <div>
                    <p className="text-sm font-medium">Amendment Requests</p>
                    <p className="text-xs text-muted-foreground">
                      {amendmentCount === 0 
                        ? "No pending amendments" 
                        : `${amendmentCount} amendment request${amendmentCount > 1 ? "s" : ""} awaiting review`
                      }
                    </p>
                  </div>
                </div>
                {amendmentCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {amendmentCount > 99 ? "99+" : amendmentCount}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/attendance/reconciliation" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  <div>
                    <p className="text-sm font-medium">Attendance Reconciliation</p>
                    <p className="text-xs text-muted-foreground">
                      {reconciliationCount === 0 
                        ? "No pending reconciliations" 
                        : `${reconciliationCount} reconciliation request${reconciliationCount > 1 ? "s" : ""} awaiting review`
                      }
                    </p>
                  </div>
                </div>
                {reconciliationCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {reconciliationCount > 99 ? "99+" : reconciliationCount}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin" className="flex items-center gap-2">
                <Bell className="size-4" />
                <span>View Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/leave" className="flex items-center gap-2">
                <Bell className="size-4" />
                <span>Leave Management</span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem disabled>
            <div className="flex items-center gap-2">
              <Bell className="size-4" />
              <span className="text-muted-foreground">No new notifications</span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


