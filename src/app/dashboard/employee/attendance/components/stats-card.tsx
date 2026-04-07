"use client";

import { useMemo } from "react";
import {
  CalendarCheck2,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMonthlyAttendanceSummary } from "@/lib/queries/attendance";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  bgColor,
  barValue,
  barColor,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  barValue?: number; // 0–100
  barColor?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-md p-1.5 ${bgColor}`}>
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {typeof barValue === "number" && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor ?? "bg-primary"}`}
              style={{ width: `${Math.min(barValue, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AttendanceStatsCard() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const { data: summary, isLoading } = useMyMonthlyAttendanceSummary({ year, month });

  const stats = useMemo(() => {
    if (!summary) return null;
    const present = summary.totalPresentDays ?? 0;
    const late = summary.totalLateDays ?? 0;
    const workingDays = summary.totalWorkingDays ?? 0;
    const onTime = Math.max(0, present - late);
    const attendancePct = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;
    const onTimePct = present > 0 ? Math.round((onTime / present) * 100) : 0;
    const latePct = present > 0 ? Math.round((late / present) * 100) : 0;

    return { present, late, onTime, attendancePct, onTimePct, latePct, workingDays };
  }, [summary]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Days Present"
        value={stats.present}
        subtitle={`${stats.workingDays} working days in ${monthLabel}`}
        icon={CalendarCheck2}
        iconColor="text-emerald-600"
        bgColor="bg-emerald-50 dark:bg-emerald-950/30"
        barValue={stats.attendancePct}
        barColor="bg-emerald-500"
      />
      <StatCard
        title="On Time"
        value={stats.onTime}
        subtitle={`${stats.onTimePct}% of present days`}
        icon={Clock}
        iconColor="text-blue-600"
        bgColor="bg-blue-50 dark:bg-blue-950/30"
        barValue={stats.onTimePct}
        barColor="bg-blue-500"
      />
      <StatCard
        title="Late Arrivals"
        value={stats.late}
        subtitle={`${stats.latePct}% of present days`}
        icon={AlertTriangle}
        iconColor="text-amber-600"
        bgColor="bg-amber-50 dark:bg-amber-950/30"
        barValue={stats.latePct}
        barColor="bg-amber-500"
      />
      <StatCard
        title="Attendance Rate"
        value={`${stats.attendancePct}%`}
        subtitle={`${monthLabel}`}
        icon={TrendingUp}
        iconColor={stats.attendancePct >= 90 ? "text-emerald-600" : stats.attendancePct >= 75 ? "text-amber-600" : "text-red-600"}
        bgColor={stats.attendancePct >= 90 ? "bg-emerald-50 dark:bg-emerald-950/30" : stats.attendancePct >= 75 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30"}
        barValue={stats.attendancePct}
        barColor={stats.attendancePct >= 90 ? "bg-emerald-500" : stats.attendancePct >= 75 ? "bg-amber-500" : "bg-red-500"}
      />
    </div>
  );
}
