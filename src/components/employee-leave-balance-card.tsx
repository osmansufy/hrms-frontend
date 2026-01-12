"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAdminLeaveBalances } from "@/lib/queries/admin-leave-balances";
import type { LeaveBalance } from "@/lib/api/leave";
import type { AdminLeaveBalanceItem } from "@/lib/api/leave";

interface EmployeeLeaveBalanceCardProps {
    employeeId: string;
    userId?: string;
}

export function EmployeeLeaveBalanceCard({ employeeId, userId }: EmployeeLeaveBalanceCardProps) {
    // Fetch balances using admin endpoint with userId filter
    const { data: adminBalancesResponse, isLoading } = useAdminLeaveBalances(
        userId
            ? {
                userId: userId,
                pageSize: 100, // Get all leave types for this user
            }
            : undefined
    );

    // Transform AdminLeaveBalanceItem[] to LeaveBalance[] format
    const balances: LeaveBalance[] = React.useMemo(() => {
        if (!adminBalancesResponse?.data || !userId) {
            return [];
        }

        // API already filters by userId, so we can directly map the results
        return adminBalancesResponse.data.map((item: AdminLeaveBalanceItem) => ({
            leaveTypeId: item.leaveType.id,
            leaveTypeName: item.leaveType.name,
            leaveTypeCode: item.leaveType.code,
            leaveYear: item.leaveYear.toString(),
            available: item.balances.available,
            carried: item.balances.carried,
            used: item.balances.used,
            openingBalance: item.balances.openingBalance,
            accrued: item.balances.accrued,
            lapsed: item.balances.lapsed,
            adjusted: item.balances.adjusted,
            ledgerEntries: 0, // Not provided by admin endpoint
            policy: undefined, // Not provided by admin endpoint
        }));
    }, [adminBalancesResponse, userId]);

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
                                        {Math.round(available)} days
                                    </Badge>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <div>Used: {Math.round(used)}</div>
                                    <div>Total: {Math.round(totalAllocated)}</div>
                                </div>
                            </div>

                            <Progress
                                value={utilizationPercent}
                                className="h-2"
                            />

                            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                                <div>
                                    <div className="font-medium">Opening</div>
                                    <div>{Math.round(openingBalance)}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Accrued</div>
                                    <div>{Math.round(accrued)}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Carried</div>
                                    <div>{Math.round(carried)}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Lapsed</div>
                                    <div>{Math.round(lapsed)}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
