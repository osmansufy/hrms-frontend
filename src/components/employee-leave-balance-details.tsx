"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveTypes } from "@/lib/queries/leave";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getEmployeeLeaveBalances, type AdminLeaveBalanceItem } from "@/lib/api/leave";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface EmployeeLeaveBalanceDetailsProps {
    userId?: string;
    employeeName?: string;
}

// Helper function to safely format numbers as whole numbers
const formatNumber = (value: number | null | undefined, decimals: number = 0): string => {
    const num = Number(value) || 0;
    return Math.round(num).toFixed(decimals);
};

export function EmployeeLeaveBalanceDetails({ userId, employeeName }: EmployeeLeaveBalanceDetailsProps) {
    const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();

    const { data: employeeBalancesData, isLoading: balancesLoading } = useQuery({
        queryKey: ["employee-leave-balances", userId],
        queryFn: () => getEmployeeLeaveBalances(userId!),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const isLoading = typesLoading || balancesLoading;

    // Transform admin API response to match component structure
    const employeeBalances = employeeBalancesData?.map((item: AdminLeaveBalanceItem) => ({
        id: item.id,
        userId: item.userId,
        leaveTypeId: item.leaveType.id,
        leaveTypeName: item.leaveType.name,
        leaveTypeCode: item.leaveType.code,
        leaveYear: String(item.leaveYear),
        available: item.balances.available,
        carried: item.balances.carried,
        used: item.balances.used,
        openingBalance: item.balances.openingBalance,
        accrued: item.balances.accrued,
        lapsed: item.balances.lapsed,
        adjusted: item.balances.adjusted,
        ledgerEntries: 0, // Not provided by admin API
        policy: {
            maxDays: undefined, // Not provided by admin API
            carryForwardCap: undefined,
            encashmentFlag: undefined,
        },
    })) || [];

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Balance Details</CardTitle>
                    <CardDescription>{employeeName || "Employee"}'s complete leave information</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!employeeBalances || employeeBalances.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Balance Details</CardTitle>
                    <CardDescription>{employeeName || "Employee"}'s complete leave information</CardDescription>
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

    const totalAvailable = employeeBalances.reduce((sum, b) => {
        const available = Number(b.available) || 0;
        const carried = Number(b.carried) || 0;
        return sum + available + carried;
    }, 0);
    const totalUsed = employeeBalances.reduce((sum, b) => {
        const used = Number(b.used) || 0;
        return sum + used;
    }, 0);
    const totalLapsed = employeeBalances.reduce((sum, b) => {
        const lapsed = Number(b.lapsed) || 0;
        return sum + lapsed;
    }, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leave Balance Details</CardTitle>
                <CardDescription>{employeeName || "Employee"}'s complete leave information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Available Days</p>
                                    <p className="text-2xl font-bold text-green-700">{formatNumber(totalAvailable)}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Used Days</p>
                                    <p className="text-2xl font-bold text-yellow-700">{formatNumber(totalUsed)}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-yellow-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Lapsed Days</p>
                                    <p className="text-2xl font-bold text-red-700">{formatNumber(totalLapsed)}</p>
                                </div>
                                <TrendingDown className="h-8 w-8 text-red-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Table */}
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Leave Type</TableHead>
                                <TableHead className="text-right">Available</TableHead>
                                <TableHead className="text-right">Carried</TableHead>
                                <TableHead className="text-right">Used</TableHead>
                                <TableHead className="text-right">Accrued</TableHead>
                                <TableHead className="text-right">Lapsed</TableHead>
                                <TableHead className="text-right">Adjusted</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employeeBalances.map((balance) => {
                                const leaveType = leaveTypes?.find(lt => lt.id === balance.leaveTypeId);
                                const available = Number(balance.available) || 0;
                                const carried = Number(balance.carried) || 0;
                                const used = Number(balance.used) || 0;
                                const totalAllocated = available + carried + used;
                                const utilization = totalAllocated > 0 ? (used / totalAllocated) * 100 : 0;

                                let statusColor = "default";
                                let statusText = "Good";

                                if (balance.available <= 0) {
                                    statusColor = "destructive";
                                    statusText = "Exhausted";
                                } else if (utilization > 75) {
                                    statusColor = "secondary";
                                    statusText = "High Usage";
                                } else if (balance.available < 3) {
                                    statusColor = "outline";
                                    statusText = "Low Balance";
                                }

                                return (
                                    <TableRow key={balance.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <div>
                                                <p className="font-semibold">{leaveType?.name || "Unknown"}</p>
                                                <p className="text-xs text-muted-foreground">{balance.leaveYear}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">
                                            {formatNumber(balance.available)}
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600">
                                            {balance.carried > 0 ? formatNumber(balance.carried) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-yellow-600">
                                            {formatNumber(balance.used)}
                                        </TableCell>
                                        <TableCell className="text-right text-purple-600">
                                            {balance.accrued > 0 ? formatNumber(balance.accrued) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {balance.lapsed > 0 ? formatNumber(balance.lapsed) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {balance.adjusted !== 0 ? (
                                                <span className={balance.adjusted > 0 ? "text-green-600" : "text-red-600"}>
                                                    {balance.adjusted > 0 ? "+" : ""}{formatNumber(balance.adjusted)}
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusColor as any}>{statusText}</Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Detailed Breakdown Cards */}

            </CardContent>
        </Card>
    );
}
