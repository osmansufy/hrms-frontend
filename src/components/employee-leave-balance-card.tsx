"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveTypes } from "@/lib/queries/leave";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAllUsersBalances, getUserBalances, type LeaveBalance, type UserBalanceWithEmployee } from "@/lib/api/leave";
import { Progress } from "@/components/ui/progress";

interface EmployeeLeaveBalanceCardProps {
    employeeId: string;
    userId?: string;
}

export function EmployeeLeaveBalanceCard({ employeeId, userId }: EmployeeLeaveBalanceCardProps) {
    const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();

    // Try to fetch balances - use admin endpoint if available, otherwise use current user endpoint
    const { data: allUserBalances, isLoading: allBalancesLoading } = useQuery({
        queryKey: ["all-users-balances"],
        queryFn: () => getAllUsersBalances(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false, // Don't retry if admin endpoint fails
    });

    const { data: currentUserBalances, isLoading: currentBalancesLoading } = useQuery({
        queryKey: ["user-balances"],
        queryFn: () => getUserBalances(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !allUserBalances, // Only fetch if admin endpoint didn't work
        retry: false,
    });

    // Determine which balances to use and filter by userId
    const balances: LeaveBalance[] = React.useMemo(() => {
        if (allUserBalances && userId) {
            // Filter admin balances by userId
            return allUserBalances
                .filter((b: UserBalanceWithEmployee) => b.userId === userId)
                .map((b: UserBalanceWithEmployee) => ({
                    leaveTypeId: b.leaveTypeId,
                    leaveTypeName: b.leaveTypeName,
                    leaveTypeCode: b.leaveTypeCode,
                    leaveYear: b.leaveYear,
                    available: b.available,
                    carried: b.carried,
                    used: b.used,
                    openingBalance: b.openingBalance,
                    accrued: b.accrued,
                    lapsed: b.lapsed,
                    adjusted: b.adjusted,
                    ledgerEntries: b.ledgerEntries,
                    policy: b.policy,
                }));
        } else if (currentUserBalances && userId) {
            // If using current user balances, only show if it's for the same user
            // This is a fallback - ideally we'd have an admin endpoint
            return currentUserBalances.filter((b: LeaveBalance) =>
                b.userId === userId
            );
        }
        return [];
    }, [allUserBalances, currentUserBalances, userId]);

    const isLoading = typesLoading || allBalancesLoading || currentBalancesLoading;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Balance</CardTitle>
                    <CardDescription>Current leave balance overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!balances || balances.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Balance</CardTitle>
                    <CardDescription>Current leave balance overview</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No leave balance initialized for this employee
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
                <CardDescription>Current leave balance overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {balances.map((balance) => {
                    // Safely convert all values to numbers
                    const toNumber = (value: any): number => {
                        if (value === null || value === undefined) return 0;
                        const num = Number(value);
                        return isNaN(num) ? 0 : num;
                    };

                    const openingBalance = toNumber(balance.openingBalance);
                    const accrued = toNumber(balance.accrued);
                    const carried = toNumber(balance.carried);
                    const adjusted = toNumber(balance.adjusted);
                    const used = toNumber(balance.used);
                    const available = toNumber(balance.available);
                    const lapsed = toNumber(balance.lapsed);

                    const totalAllocated = openingBalance + accrued + carried + adjusted;
                    const utilizationPercent = totalAllocated > 0
                        ? Math.round((used / totalAllocated) * 100)
                        : 0;
                    const availablePercent = totalAllocated > 0
                        ? Math.round((available / totalAllocated) * 100)
                        : 0;

                    // Determine status color
                    let statusColor = "default";
                    let statusIcon = null;
                    if (available < 0) {
                        statusColor = "destructive";
                        statusIcon = <TrendingDown className="h-3 w-3" />;
                    } else if (availablePercent < 20 && available > 0) {
                        statusColor = "secondary";
                        statusIcon = <TrendingDown className="h-3 w-3" />;
                    } else if (availablePercent >= 80) {
                        statusColor = "default";
                        statusIcon = <TrendingUp className="h-3 w-3" />;
                    }

                    return (
                        <div key={balance.leaveTypeId} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                        {balance.leaveTypeName}
                                    </span>
                                    <Badge variant={statusColor as any} className="text-xs">
                                        {statusIcon}
                                        {available.toFixed(1)} days
                                    </Badge>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <div>Used: {used.toFixed(1)}</div>
                                    <div>Total: {totalAllocated.toFixed(1)}</div>
                                </div>
                            </div>

                            <Progress
                                value={utilizationPercent}
                                className="h-2"
                            />

                            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                                <div>
                                    <div className="font-medium">Opening</div>
                                    <div>{openingBalance.toFixed(1)}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Accrued</div>
                                    <div>{accrued.toFixed(1)}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Carried</div>
                                    <div>{carried.toFixed(1)}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Lapsed</div>
                                    <div>{lapsed.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
