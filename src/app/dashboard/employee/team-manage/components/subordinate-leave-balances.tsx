"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubordinateBalances } from "@/lib/queries/leave";
import type { LeaveBalance } from "@/lib/api/leave";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

interface SubordinateLeaveBalancesProps {
  userId: string;
}

export function SubordinateLeaveBalances({
  userId,
}: SubordinateLeaveBalancesProps) {
  const { data: balances, isLoading, error } = useSubordinateBalances(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Failed to load leave balances</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground text-sm py-8">
            No leave balances found for this employee
          </p>
        </CardContent>
      </Card>
    );
  }

  const getBalanceStatus = (available: number, used: number) => {
    const total = available + used;
    if (total === 0) return "neutral";
    const utilizationRate = (used / total) * 100;
    if (available <= 0) return "critical";
    if (utilizationRate > 70) return "warning";
    return "healthy";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      case "healthy":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balances ({new Date().getFullYear()})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map((balance) => {
            const status = getBalanceStatus(balance.available, balance.used);
            const total = balance.available + balance.used;
            const utilizationRate = total > 0 ? (balance.used / total) * 100 : 0;

            return (
              <Card key={balance.id || balance.leaveTypeId} className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-base">
                          {balance.leaveTypeName || "Unknown"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {balance.leaveTypeCode}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(status)}>
                        {balance.available} left
                      </Badge>
                    </div>

                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className="text-2xl font-bold text-primary">
                          {balance.available}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Used</p>
                        <p className="text-2xl font-bold">{balance.used}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Utilization</span>
                        <span>{utilizationRate.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            status === "critical"
                              ? "bg-destructive"
                              : status === "warning"
                              ? "bg-yellow-500"
                              : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="pt-2 border-t space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Opening</span>
                          <span className="font-medium">
                            {balance.openingBalance}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Accrued</span>
                          <span className="font-medium flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            {balance.accrued}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Carried</span>
                          <span className="font-medium">{balance.carried}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Adjusted</span>
                          <span className="font-medium">
                            {balance.adjusted > 0 ? "+" : ""}
                            {balance.adjusted}
                          </span>
                        </div>
                      </div>

                      {balance.lapsed > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t">
                          <span className="text-muted-foreground">Lapsed</span>
                          <span className="font-medium flex items-center gap-1 text-destructive">
                            <TrendingDown className="h-3 w-3" />
                            {balance.lapsed}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
