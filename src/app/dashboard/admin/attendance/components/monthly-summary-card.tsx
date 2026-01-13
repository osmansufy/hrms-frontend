"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMonthlyAttendanceSummary } from "@/lib/queries/attendance";
import { Loader2, Calendar, Users, CheckCircle2, Clock, XCircle, CalendarDays, TrendingUp, BarChart3 } from "lucide-react";
import { useMemo } from "react";

interface MonthlySummaryCardProps {
  year: number;
  month: number;
  departmentId?: string;
  userId?: string;
}

export function MonthlySummaryCard({ year, month, departmentId, userId }: MonthlySummaryCardProps) {
  const { data: summary, isLoading } = useMonthlyAttendanceSummary({
    year,
    month,
    departmentId,
    userId,
  });

  const monthName = useMemo(() => {
    return new Date(year, month - 1).toLocaleString("default", { month: "long" });
  }, [year, month]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Attendance Summary
          </CardTitle>
          <CardDescription>{monthName} {year}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const stats = [
    {
      label: "Total Working Days",
      value: summary.totalWorkingDays,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Employees",
      value: summary.totalEmployees,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Days Present",
      value: summary.totalPresent,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Late Arrivals",
      value: summary.totalLate,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Days Absent",
      value: summary.totalAbsent,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "On Leave",
      value: summary.totalOnLeave,
      icon: CalendarDays,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Monthly Attendance Summary
        </CardTitle>
        <CardDescription>
          {monthName} {year}
          {departmentId && " • Filtered by Department"}
          {userId && " • Employee View"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-lg border p-4 ${stat.bgColor}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color} opacity-50`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-4 border-t">
          <div className="rounded-lg border p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Attendance Rate
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {summary.attendancePercentage.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Hours Worked
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {summary.totalHoursWorked.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">hours</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Hours/Day
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {summary.avgHoursPerDay.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per day</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Summary Text */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            In {monthName} {year}, {summary.totalEmployees} employee
            {summary.totalEmployees !== 1 ? "s" : ""} worked a total of{" "}
            <span className="font-semibold text-foreground">
              {summary.totalPresent}
            </span>{" "}
            day{summary.totalPresent !== 1 ? "s" : ""}, with{" "}
            <span className="font-semibold text-foreground">
              {summary.totalLate}
            </span>{" "}
            late arrival{summary.totalLate !== 1 ? "s" : ""},{" "}
            <span className="font-semibold text-foreground">
              {summary.totalAbsent}
            </span>{" "}
            absent day{summary.totalAbsent !== 1 ? "s" : ""}, and{" "}
            <span className="font-semibold text-foreground">
              {summary.totalOnLeave}
            </span>{" "}
            day{summary.totalOnLeave !== 1 ? "s" : ""} on leave. The overall
            attendance rate was{" "}
            <span className="font-semibold text-foreground">
              {summary.attendancePercentage.toFixed(1)}%
            </span>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
