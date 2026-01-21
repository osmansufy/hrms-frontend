"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmployeeMonthlySummary } from "@/lib/api/attendance";
import { useMonthlyAttendanceSummary } from "@/lib/queries/attendance";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, Users, CheckCircle2, Clock, XCircle, CalendarDays, TrendingUp, BarChart3 } from "lucide-react";
import { useMemo } from "react";

interface MonthlySummaryCardProps {
  year: number;
  month: number;
  departmentId?: string;
  userId?: string;
}

export function MonthlySummaryCard({ year, month, departmentId, userId }: MonthlySummaryCardProps) {
  console.log({month, year});
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["attendance", "monthly-summary", year, month, departmentId, userId],
    queryFn: () => getEmployeeMonthlySummary(userId!, year, month),
    enabled: !!userId,
  });

  const summary = summaryData;

  const stats = [
    {
      label: "Total Working Days",
      value: summary?.totalWorkingDays,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },

    {
      label: "Days Present",
      value: summary?.totalPresentDays,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Late Arrivals",
      value: summary?.totalLateDays,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Days Absent",
      value: summary?.totalAbsentDays,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "On Leave",
      value: summary?.totalOnLeaveDays,
      icon: CalendarDays,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Total working hours",
      value: summary?.totalHoursWorked,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total expected hours",
      value: summary?.totalExpectedHours,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
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
          {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {year}
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
                      {stat.value?.toLocaleString()}
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


          <div className="rounded-lg border p-4  from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {/* Total lost hours  which is not covered by overtime*/}
                  Total Lost Hours
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {summary?.totalLostHours ? (summary?.totalLostHours || 0) - (summary?.totalOvertimeHours || 0) : 0} 
                </p>
                <p className="text-xs text-muted-foreground mt-1">hours</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </div>

         
        </div>

        {/* Summary Text */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">

            <span className="font-semibold text-foreground">
              {summary?.totalPresentDays}
            </span>{" "}
            day{summary?.totalPresentDays !== 1 ? "s" : ""}, with{" "}
            <span className="font-semibold text-foreground">
              {summary?.totalLateDays}
            </span>{" "}
            late arrival{summary?.totalLateDays !== 1 ? "s" : ""},{" "}
            <span className="font-semibold text-foreground">
              {summary?.totalAbsentDays}
            </span>{" "}
            absent day{summary?.totalAbsentDays !== 1 ? "s" : ""}, and{" "}
            <span className="font-semibold text-foreground">
              {summary?.totalOnLeaveDays}
            </span>{" "}
            day{summary?.totalOnLeaveDays !== 1 ? "s" : ""} on leave. The overall
            attendance rate was{" "}

            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
