"use client";

import { useMemo } from "react";
import {
  Clock4,
  Coffee,
  LogIn,
  LogOut,
  FileSearch,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
} from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTodayAttendance, useActiveBreak } from "@/lib/queries/attendance";
import { AttendanceStatsCard } from "./components/stats-card";
import { ComprehensiveHistoryTab } from "./components/comprehensive-history-tab";
import { BreakTracker } from "./components/break-tracker";
import { BreakHistoryCard } from "./components/break-history-card";
import { BreakStatsCard } from "./components/break-stats-card";
import Link from "next/link";
import { formatTimeInTimezone, cn } from "@/lib/utils";

export default function AttendancePage() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { data, isLoading } = useTodayAttendance(userId);
  const { data: activeBreakResponse } = useActiveBreak();
  const activeBreak = activeBreakResponse?.activeBreak;

  const isSignedIn = Boolean(data && !data.signOut);

  const statusConfig = useMemo(() => {
    if (isLoading)   return { label: "Checking…",       icon: Clock4,        color: "text-muted-foreground",                    bg: "bg-muted/50",                       ring: "ring-border" };
    if (!data)       return { label: "Not Signed In",   icon: XCircle,       color: "text-red-600 dark:text-red-400",           bg: "bg-red-50 dark:bg-red-950/30",      ring: "ring-red-200 dark:ring-red-900" };
    if (data.signOut) return { label: "Signed Out",     icon: LogOut,        color: "text-slate-600 dark:text-slate-400",       bg: "bg-slate-50 dark:bg-slate-900/30",  ring: "ring-slate-200 dark:ring-slate-800" };
    if (data.isLate) return { label: "Signed In · Late", icon: AlertCircle,  color: "text-amber-600 dark:text-amber-400",       bg: "bg-amber-50 dark:bg-amber-950/30",  ring: "ring-amber-200 dark:ring-amber-900" };
    return           { label: "Signed In",              icon: CheckCircle2,  color: "text-emerald-600 dark:text-emerald-400",   bg: "bg-emerald-50 dark:bg-emerald-950/30", ring: "ring-emerald-200 dark:ring-emerald-900" };
  }, [data, isLoading]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const StatusIcon = statusConfig.icon;

  return (
    <div className="container space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {todayLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Attendance</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeBreak && (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              <Coffee className="size-3" />
              On Break
            </div>
          )}

          <div className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1",
            statusConfig.bg, statusConfig.color, statusConfig.ring,
          )}>
            <StatusIcon className="size-4" />
            {statusConfig.label}
          </div>

          <Link href="/dashboard/employee/attendance/reconciliation">
            <Button variant="outline" size="sm" className="gap-2">
              <FileSearch className="size-4" />
              Reconciliation
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Today's Activity Card ── */}
      {data && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 px-5 py-4">
            {/* Sign-in time */}
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <LogIn className="size-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Clocked In</div>
                <div className={cn("text-sm font-semibold", data.isLate && "text-amber-600")}>
                  {data.signIn ? formatTimeInTimezone(data.signIn) : "—"}
                </div>
              </div>
              {data.isLate && (
                <Badge variant="outline" className="h-5 border-amber-400 px-1.5 text-[10px] text-amber-600">
                  Late
                </Badge>
              )}
            </div>

            {/* Separator */}
            <div className="hidden h-8 w-px bg-border sm:block" />

            {/* Sign-out time or "currently working" pulse */}
            {data.signOut ? (
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <LogOut className="size-4 text-slate-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Clocked Out</div>
                  <div className="text-sm font-semibold">{formatTimeInTimezone(data.signOut)}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                Currently working
              </div>
            )}

            {/* Active break pill in the card */}
            {activeBreak && (
              <>
                <div className="hidden h-8 w-px bg-border sm:block" />
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Timer className="size-4" />
                  <span className="font-medium">Break in progress</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Monthly summary stat cards ── */}
      <AttendanceStatsCard />

      {/* ── Break management (only when signed in and not yet signed out) ── */}
      {isSignedIn && (
        <section className="space-y-5">
          {/* Section header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
                <Coffee className="size-4 text-orange-600" />
              </div>
              <h2 className="text-base font-semibold">Break Management</h2>
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Break tracker + today's break history */}
          <div className="grid gap-4 md:grid-cols-2">
            <BreakTracker />
            <BreakHistoryCard />
          </div>
        </section>
      )}

      {/* ── Break history with filter (always visible) ── */}
      <BreakStatsCard />

      {/* ── Attendance history + date filters ── */}
      <ComprehensiveHistoryTab />
    </div>
  );
}
