"use client";

import { useMemo } from "react";
import { Clock4 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { useTodayAttendance } from "@/lib/queries/attendance";
import { AttendanceStatsCard } from "./components/stats-card";
import { ComprehensiveHistoryTab } from "./components/comprehensive-history-tab";

export default function AttendancePage() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { data, isLoading } = useTodayAttendance(userId);

  const status = useMemo(() => {
    if (isLoading) return "Checking status…";
    if (!data) return "Not signed in";
    if (data.signOut) return "Signed out";
    return "Signed in";
  }, [data, isLoading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Presence</p>
          <h1 className="text-2xl font-semibold">Attendance</h1>
        </div>
        <Badge variant={data?.isLate ? "destructive" : "secondary"}>
          <Clock4 className="mr-1 size-4" />
          {status}
        </Badge>
      </div>
      <div className="flex gap-2">
        <a href="/dashboard/employee/attendance/reconciliation">
          <button className="btn btn-secondary">Reconciliation Requests</button>
        </a>
      </div>

      <AttendanceStatsCard />

      <ComprehensiveHistoryTab />
    </div>
  );
}
