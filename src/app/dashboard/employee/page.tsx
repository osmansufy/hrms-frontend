"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { Calendar, TrendingUp, AlertCircle, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/components/auth/session-provider";
import { useUserBalances, useMyLeaves } from "@/lib/queries/leave";
import type { LeaveBalance, LeaveRecord } from "@/lib/api/leave";

// Helper function for calculating balance percentage
function calculateBalancePercentage(balance: LeaveBalance): number {
  const totalAllocated = balance.balance + balance.carryForward || balance.balance;
  const available = balance.balance;
  return totalAllocated > 0 ? (available / totalAllocated) * 100 : 0;
}

export default function EmployeeDashboard() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: balances, isLoading: balancesLoading, error: balancesError } = useUserBalances();
  const { data: leaves, isLoading: leavesLoading, error: leavesError } = useMyLeaves(userId);

  // Memoize leave statistics calculations
  const leaveStats = useMemo(() => {
    if (!balances && !leaves) return null;

    return {
      totalAvailableDays: balances?.reduce((sum, b) => sum + b.balance, 0) || 0,
      totalCarryForward: balances?.reduce((sum, b) => sum + b.carryForward, 0) || 0,
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

      {/* Leave Statistics Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Leave Overview</h2>
        <div className="grid gap-4 md:grid-cols-4" role="region" aria-label="Leave statistics">
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
              const totalAllocated = balance.balance + balance.carryForward || balance.balance;
              const available = balance.balance;
              const percentage = calculateBalancePercentage(balance);
              const leaveTypeCode = balance.leaveType?.code || balance.leaveTypeCode || 'unknown';
              const leaveTypeName = balance.leaveType?.name || balance.leaveTypeName || 'Unknown';

              return (
                <Card key={balance.leaveTypeId || balance.id} className="hover:shadow-md transition-all" data-testid={`balance-card-${leaveTypeCode}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">
                        {leaveTypeName}
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
                      {balance.carryForward > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">
                            +{balance.carryForward} carried forward
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>View and update your information.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/employee/profile">
                Go to profile
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Sign in/out and view today&apos;s status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/employee/attendance">
                Manage attendance
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
              <CardDescription>Request time off and track approvals.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/employee/leave">
                Request leave
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Directory</CardTitle>
              <CardDescription>Browse colleagues and teams.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/employee/directory">
                View directory
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
