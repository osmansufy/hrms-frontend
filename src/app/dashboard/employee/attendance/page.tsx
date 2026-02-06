"use client";

import { useMemo } from "react";
import { Clock4, Coffee } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { useTodayAttendance, useActiveBreak } from "@/lib/queries/attendance";
import { AttendanceStatsCard } from "./components/stats-card";
import { ComprehensiveHistoryTab } from "./components/comprehensive-history-tab";
import { BreakTracker } from "./components/break-tracker";
import { BreakHistoryCard } from "./components/break-history-card";
import { BreakStatsCard } from "./components/break-stats-card";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AttendancePage() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { data, isLoading } = useTodayAttendance(userId);
  const { data: activeBreakResponse } = useActiveBreak();
  const activeBreak = activeBreakResponse?.activeBreak;

  const status = useMemo(() => {
    if (isLoading) return "Checking status…";
    if (!data) return "Not signed in";
    if (data.signOut) return "Signed out";
    return "Signed in";
  }, [data, isLoading]);

  const isSignedIn = data && !data.signOut;

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Presence</p>
          <h1 className="text-2xl font-semibold">Attendance</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Active Break Badge */}
          {activeBreak && (
            <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
              <Coffee className="mr-1 size-3" />
              On Break
            </Badge>
          )}
          {/* Attendance Status Badge */}
          <Badge variant={data?.isLate ? "destructive" : "secondary"}>
            <Clock4 className="mr-1 size-4" />
            {status}
          </Badge>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href="/dashboard/employee/attendance/reconciliation">
          <button className="btn btn-secondary">Reconciliation Requests</button>
        </Link>
      </div>

      <AttendanceStatsCard />

      {/* Break Management Section - Only show when signed in */}
      {isSignedIn && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <h2 className="text-lg font-semibold">Break Management</h2>
            <div className="h-px flex-1 bg-border" />
          </div>

          <BreakStatsCard />
        </div>
      )}

      <ComprehensiveHistoryTab />
    </div>
  );
}
