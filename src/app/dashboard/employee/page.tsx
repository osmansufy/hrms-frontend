"use client";

import { useMemo, useCallback, useState } from "react";
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
  const { session } = useSession();
  const userId = session?.user.id;
  const [location, setLocation] = useState("");

  const { data: balances, isLoading: balancesLoading, error: balancesError } = useUserBalances();
  const { data: leaves, isLoading: leavesLoading, error: leavesError } = useMyLeaves(userId);

  // Attendance queries
  const { data: todayAttendance, isLoading: attendanceLoading, isFetching: attendanceFetching } = useTodayAttendance(userId);
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

  // Memoize leave statistics calculations
  const leaveStats = useMemo(() => {
    if (!balances && !leaves) return null;

    return {
      totalAvailableDays: balances?.reduce((sum, b) => sum + b.available, 0) || 0,
      totalCarryForward: balances?.reduce((sum, b) => sum + b.carried, 0) || 0,
      pendingLeaves: leaves?.filter(l => l.status === "PENDING").length || 0,
      approvedLeaves: leaves?.filter(l => l.status === "APPROVED").length || 0,
    };
  }, [balances, leaves]);

  // Memoize recent leaves sorting
  const recentLeaves = useMemo(() => {
    if (!leaves) return [];
    return [...leaves]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [leaves]);

  // Memoize displayed balances
  const displayedBalances = useMemo(() => {
    return balances?.slice(0, 3) || [];
  }, [balances]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold">Your Dashboard</h1>
        </div>
      </div>

      {/* Error States */}
      {(balancesError || leavesError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {balancesError && "Failed to load leave balances. "}
            {leavesError && "Failed to load leave requests. "}
            Please refresh the page or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      )}



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

      {/* Leave Statistics Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5" role="region" aria-label="Dashboard statistics">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balancesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading available days" />
              ) : (
                <div className="flex items-baseline gap-2" data-testid="available-days">
                  <span className="text-3xl font-bold">{leaveStats?.totalAvailableDays ?? 0}</span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Carried Forward
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balancesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading carried forward days" />
              ) : (
                <div className="flex items-baseline gap-2" data-testid="carried-forward-days">
                  <span className="text-3xl font-bold">{leaveStats?.totalCarryForward ?? 0}</span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leavesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading pending requests" />
              ) : (
                <div className="flex items-baseline gap-2" data-testid="pending-requests">
                  <span className="text-3xl font-bold">{leaveStats?.pendingLeaves ?? 0}</span>
                  <span className="text-sm text-muted-foreground">requests</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved This Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leavesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading approved leaves" />
              ) : (
                <div className="flex items-baseline gap-2" data-testid="approved-leaves">
                  <span className="text-3xl font-bold">{leaveStats?.approvedLeaves ?? 0}</span>
                  <span className="text-sm text-muted-foreground">leaves</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lost Hours (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2" data-testid="lost-hours">
                <span className="text-3xl font-bold">
                  {Math.round(((myLostHours?.totalLostMinutes) || 0) / 60)}
                </span>
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Leave Balances by Type */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Leave Balances</h2>

          <Link
            href="/dashboard/employee/leave"
            className="text-sm text-primary hover:underline"
            aria-label="View all leave balances"
          >
            View all →
          </Link>
        </div>
        {balancesLoading ? (
          <div className="flex items-center justify-center py-8" role="status" aria-label="Loading leave balances">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayedBalances.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="leave-balances-grid">
            {displayedBalances.map((balance) => {
              const totalAllocated = balance.openingBalance + balance.carried || balance.openingBalance;
              const available = balance.available;
              const percentage = calculateBalancePercentage(balance);


              return (
                <Card key={balance.leaveTypeId || balance.id} className="hover:shadow-md transition-all" data-testid={`balance-card-${balance.leaveTypeCode || balance.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">
                        {balance.leaveTypeName}
                      </CardTitle>
                      {percentage >= 50 ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Good</Badge>
                      ) : percentage >= 25 ? (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Limited</Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Low
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Available</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold">{available}</span>
                          <span className="text-sm text-muted-foreground ml-1">days</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{available} of {totalAllocated} days</span>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                      </div>
                      {balance.carried > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">
                            +{balance.carried} carried forward
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No leave balances available
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Leave Requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Leave Requests</h2>
          <Link
            href="/dashboard/employee/leave"
            className="text-sm text-primary hover:underline"
            aria-label="View all leave requests"
          >
            View all →
          </Link>
        </div>
        {leavesLoading ? (
          <div className="flex items-center justify-center py-8" role="status" aria-label="Loading leave requests">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recentLeaves.length > 0 ? (
          <div className="space-y-3" data-testid="recent-leaves-list">
            {recentLeaves.map((leave) => (
              <Card key={leave.id} className="hover:shadow-sm transition-all" data-testid={`leave-card-${leave.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(leave.status)}
                        <span className="font-medium">{leave.leaveType?.name || "Leave"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      {leave.reason && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {leave.reason}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(leave.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No leave requests yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
