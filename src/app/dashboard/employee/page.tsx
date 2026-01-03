"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, TrendingUp, AlertCircle, Clock, CheckCircle, XCircle, Loader2, ClockAlert, CheckCircle2, LogOut, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/components/auth/session-provider";
import { useUserBalances, useMyLeaves } from "@/lib/queries/leave";
import { LeavePieChart } from "./components/leave-pie-chart";
import { AttendanceBarChart } from "./components/attendance-bar-chart";
import { AttendancePieChart } from "./components/attendance-pie-chart";
import { useMyAttendanceRecords } from "@/lib/queries/attendance";
import { useSignIn, useSignOut, useTodayAttendance, useMyLostHoursReport } from "@/lib/queries/attendance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LeaveBalance, LeaveRecord } from "@/lib/api/leave";

// Helper function for calculating balance percentage
function calculateBalancePercentage(balance: LeaveBalance): number {
  const totalAllocated = balance.openingBalance + balance.carried || balance.openingBalance;
  const available = balance.available;
  return totalAllocated > 0 ? (available / totalAllocated) * 100 : 0;
}

export default function EmployeeDashboard() {

  // Session and userId
  const { session } = useSession();
  const userId = session?.user.id;

  // Attendance chart data for last 7 days
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  const chartQueryParams = {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    limit: "7",
  };
  const { data: attendanceChartData } = useMyAttendanceRecords(userId, chartQueryParams);
  const attendanceBarData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const rec = attendanceChartData?.data?.find(r => {
      const recDate = new Date(r.date);
      return recDate.getFullYear() === d.getFullYear() && recDate.getMonth() === d.getMonth() && recDate.getDate() === d.getDate();
    });
    return {
      date: dateStr,
      present: rec?.signIn ? 1 : 0,
      late: rec?.isLate ? 1 : 0,
      absent: rec?.signIn ? 0 : 1,
    };
  });

  // Location state
  const [location, setLocation] = useState("");

  // Attendance queries
  const { data: todayAttendance, isLoading: attendanceLoading, isFetching: attendanceFetching } = useTodayAttendance(userId);


  // Live worked hours clock
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const todayDate = new Date().toLocaleDateString();
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (todayAttendance?.signIn && !todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      interval = setInterval(() => {
        setWorkedSeconds(Math.floor((Date.now() - signIn.getTime()) / 1000));
      }, 1000);
      // Set initial value
      setWorkedSeconds(Math.floor((Date.now() - signIn.getTime()) / 1000));
    } else if (todayAttendance?.signIn && todayAttendance?.signOut) {
      const signIn = new Date(todayAttendance.signIn);
      const signOut = new Date(todayAttendance.signOut);
      setWorkedSeconds(Math.floor((signOut.getTime() - signIn.getTime()) / 1000));
    } else {
      setWorkedSeconds(0);
    }
    return () => interval && clearInterval(interval);
  }, [todayAttendance?.signIn, todayAttendance?.signOut]);

  function formatWorkedTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }


  // Pie chart data for monthly leaves
  const { data: leaves } = useMyLeaves(userId);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLeaves = (leaves || []).filter(l => {
    const start = new Date(l.startDate);
    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
  });
  const leaveTypeMap: Record<string, { name: string; value: number; color: string }> = {};
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#fa8072"];
  let colorIdx = 0;
  for (const leave of monthlyLeaves) {
    const type = leave.leaveType?.name || "Other";
    if (!leaveTypeMap[type]) {
      leaveTypeMap[type] = { name: type, value: 0, color: colors[colorIdx % colors.length] };
      colorIdx++;
    }
    leaveTypeMap[type].value += 1;
  }
  const pieData = Object.values(leaveTypeMap);


  const signInMutation = useSignIn(userId);
  const signOutMutation = useSignOut(userId);

  // Lost hours report for last 7 days
  const start7 = new Date();
  start7.setDate(start7.getDate() - 7);
  const { data: lostHoursData } = useMyLostHoursReport(userId, {
    startDate: start7.toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });
  const myLostHours = lostHoursData?.[0]; // Employee endpoint returns array with single item

  // Memoize attendance status
  const attendanceStatus = useMemo(() => {
    if (attendanceLoading) return "Checking status…";
    if (!todayAttendance) return "Not signed in";
    if (todayAttendance.signOut) return "Signed out";
    return "Signed in";
  }, [todayAttendance, attendanceLoading]);

  // Attendance handlers
  const handleSignIn = useCallback(async () => {
    try {
      await signInMutation.mutateAsync({ location: location || undefined });
      toast.success("Signed in successfully");
      setLocation("");
    } catch (err) {
      console.error(err);
      toast.error("Sign-in failed");
    }
  }, [signInMutation, location]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutMutation.mutateAsync({ location: location || undefined });
      toast.success("Signed out successfully");
      setLocation("");
    } catch (err) {
      console.error(err);
      toast.error("Sign-out failed");
    }
  }, [signOutMutation, location]);

  // Leave-related queries and calculations removed from dashboard (now only on leave page)

  // Leave status icon/badge helpers removed from dashboard

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="text-base px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 text-blue-900 font-semibold tracking-wide rounded-full">
          {`Keep pushing! Your productivity matters${session?.user?.name ? ", " + session.user.name : ""}. 🚀`}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-4 items-center justify-end">
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Date</span>
          <span className="font-medium">{todayDate}</span>
        </div>
        <div className="flex flex-col items-end px-4 py-3 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 shadow-md hover:shadow-lg transition-shadow">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-widest">⏱️ Live Work Time</span>
          <span className="font-mono text-2xl font-bold text-green-700">{formatWorkedTime(workedSeconds)}</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Link href="/dashboard/employee/attendance/reconciliation">
          <Button variant="secondary">Attendance Reconciliation</Button>
        </Link>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold">Your Dashboard</h1>
        </div>
      </div>


      {/* Attendance Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Attendance</h2>
        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Today&apos;s Attendance</CardTitle>
              <Badge
                variant={todayAttendance?.isLate ? "destructive" : "secondary"}
                className="text-sm px-3 py-1"
              >
                <Clock className="mr-1 size-4" />
                {attendanceStatus}
              </Badge>
            </div>
            <CardDescription>
              Sign in when you start and sign out when you finish. View full history on the{" "}
              <Link href="/dashboard/employee/attendance" className="text-primary hover:underline">
                attendance page
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sign In / Sign Out Action Buttons - Prominent */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={cn(
                "rounded-lg border-2 p-4 transition-all",
                !todayAttendance?.signIn
                  ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20"
                  : "border-muted bg-muted/30"
              )}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Sign In</h3>
                    {todayAttendance?.signIn && (
                      <Badge variant="outline" className="text-xs">
                        {new Date(todayAttendance.signIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleSignIn}
                    disabled={attendanceLoading || signInMutation.isPending || Boolean(todayAttendance?.signIn)}
                    className={cn(
                      "w-full h-12 text-base font-semibold",
                      !todayAttendance?.signIn
                        ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-green-900/30"
                        : ""
                    )}
                    size="lg"
                  >
                    <CheckCircle2 className="mr-2 size-5" />
                    {!todayAttendance?.signIn ? "Sign In Now" : "Already Signed In"}
                  </Button>
                </div>
              </div>

              <div className={cn(
                "rounded-lg border-2 p-4 transition-all",
                todayAttendance && !todayAttendance.signOut
                  ? "border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20"
                  : "border-muted bg-muted/30"
              )}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Sign Out</h3>
                    {todayAttendance?.signOut && (
                      <Badge variant="outline" className="text-xs">
                        {new Date(todayAttendance.signOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleSignOut}
                    disabled={!todayAttendance || Boolean(todayAttendance?.signOut) || signOutMutation.isPending}
                    variant={todayAttendance && !todayAttendance.signOut ? "default" : "outline"}
                    className={cn(
                      "w-full h-12 text-base font-semibold",
                      todayAttendance && !todayAttendance.signOut
                        ? "bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 dark:shadow-orange-900/30"
                        : ""
                    )}
                    size="lg"
                  >
                    <LogOut className="mr-2 size-5" />
                    {todayAttendance?.signOut ? "Already Signed Out" : "Sign Out Now"}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="size-4 text-muted-foreground" />
                <label htmlFor="location">Location (optional)</label>
              </div>
              <Input
                id="location"
                placeholder="e.g., Remote, Office, Client Site, Home"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Status Message */}
            {(attendanceFetching || signInMutation.isPending || signOutMutation.isPending) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                <Loader2 className="size-4 animate-spin" />
                <p>Updating attendance…</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Chart Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Attendance Overview</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Weekly Attendance Bar Chart */}
          <div>
            <AttendanceBarChart data={attendanceBarData} />
          </div>

          {/* Monthly Attendance Pie Chart */}
          <div>
            <AttendancePieChart />
          </div>
        </div>
      </div>

    </div>
  );
}
