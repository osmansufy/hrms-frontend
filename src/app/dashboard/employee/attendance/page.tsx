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
import { formatTimeInTimezone } from "@/lib/utils";

export default function AttendancePage() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { data, isLoading } = useTodayAttendance(userId);
  const { data: activeBreakResponse } = useActiveBreak();
  const activeBreak = activeBreakResponse?.activeBreak;

  const isSignedIn = Boolean(data && !data.signOut);

  const statusConfig = useMemo(() => {
    if (isLoading) return { label: "Checking…", icon: Clock4, color: "text-muted-foreground", bg: "bg-muted/40" };
    if (!data)     return { label: "Not Signed In", icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" };
    if (data.signOut) return { label: "Signed Out", icon: LogOut, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/30" };
    if (data.isLate)  return { label: "Signed In · Late", icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" };
    return { label: "Signed In", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" };
  }, [data, isLoading]);

  // Today's date label
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
          {/* Active break pill */}
          {activeBreak && (
            <Badge className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
              <Coffee className="size-3" />
              On Break
            </Badge>
          )}

          {/* Status pill */}
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="size-4" />
            {statusConfig.label}
          </div>

          {/* Reconciliation link */}
          <Link href="/dashboard/employee/attendance/reconciliation">
            <Button variant="outline" size="sm" className="gap-2">
              <FileSearch className="size-4" />
              Reconciliation
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Today's timestamps strip (when any data exists) ── */}
      {data && (
        <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <LogIn className="size-4 text-emerald-600" />
            <span className="text-muted-foreground">Sign In:</span>
            <span className={`font-semibold ${data.isLate ? "text-amber-600" : ""}`}>
              {data.signIn ? formatTimeInTimezone(data.signIn) : "—"}
            </span>
            {data.isLate && (
              <Badge variant="outline" className="h-5 border-amber-400 px-1.5 text-[10px] text-amber-600">
                Late
              </Badge>
            )}
          </div>

          {data.signOut && (
            <div className="flex items-center gap-2 text-sm">
              <LogOut className="size-4 text-slate-500" />
              <span className="text-muted-foreground">Sign Out:</span>
              <span className="font-semibold">{formatTimeInTimezone(data.signOut)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Monthly summary stat cards ── */}
      <AttendanceStatsCard />

      {/* ── Break management (only when signed in and not yet signed out) ── */}
      {isSignedIn && (
        <section className="space-y-4">
          {/* Section divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Coffee className="size-4" />
              Break Management
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Break tracker + today's break history side-by-side on md+ */}
          <div className="grid gap-4 md:grid-cols-2">
            <BreakTracker />
            <BreakHistoryCard />
          </div>

          {/* Monthly break stats */}
          <BreakStatsCard />
        </section>
      )}

      {/* ── Comprehensive history + date filters ── */}
      <ComprehensiveHistoryTab />
    </div>
  );
}
