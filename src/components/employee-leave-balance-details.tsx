"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveTypes } from "@/lib/queries/leave";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAllUsersBalances } from "@/lib/api/leave";
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

export function EmployeeLeaveBalanceDetails({ userId, employeeName }: EmployeeLeaveBalanceDetailsProps) {
    const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();

    const { data: allBalances, isLoading: balancesLoading } = useQuery({
        queryKey: ["leave-balances", "all"],
        queryFn: () => getAllUsersBalances(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const isLoading = typesLoading || balancesLoading;

    // Filter balances for this employee
    const employeeBalances = allBalances?.filter(b => b.userId === userId) || [];

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

    const totalAvailable = employeeBalances.reduce((sum, b) => sum + (b.available + b.carried), 0);
    const totalUsed = employeeBalances.reduce((sum, b) => sum + b.used, 0);
    const totalLapsed = employeeBalances.reduce((sum, b) => sum + b.lapsed, 0);

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
                                    <p className="text-2xl font-bold text-green-700">{totalAvailable.toFixed(1)}</p>
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
                                    <p className="text-2xl font-bold text-yellow-700">{totalUsed.toFixed(1)}</p>
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
                                    <p className="text-2xl font-bold text-red-700">{totalLapsed.toFixed(1)}</p>
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
                                const totalAllocated = balance.available + balance.carried + balance.used;
                                const utilization = totalAllocated > 0 ? (balance.used / totalAllocated) * 100 : 0;

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
                                            {balance.available.toFixed(1)}
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600">
                                            {balance.carried > 0 ? balance.carried.toFixed(1) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-yellow-600">
                                            {balance.used.toFixed(1)}
                                        </TableCell>
                                        <TableCell className="text-right text-purple-600">
                                            {balance.accrued > 0 ? balance.accrued.toFixed(1) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {balance.lapsed > 0 ? balance.lapsed.toFixed(1) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {balance.adjusted !== 0 ? (
                                                <span className={balance.adjusted > 0 ? "text-green-600" : "text-red-600"}>
                                                    {balance.adjusted > 0 ? "+" : ""}{balance.adjusted.toFixed(1)}
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
                <div className="grid gap-4 md:grid-cols-2">
                    {employeeBalances.map((balance) => {
                        const leaveType = leaveTypes?.find(lt => lt.id === balance.leaveTypeId);
                        const totalAllocated = balance.available + balance.carried + balance.used;
                        const percentage = totalAllocated > 0 ? (balance.used / totalAllocated) * 100 : 0;

                        return (
                            <Card key={balance.id} className="border">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{leaveType?.name || "Unknown"}</CardTitle>
                                        <Badge variant="outline">{balance.leaveYear}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Utilization</span>
                                            <span className="font-semibold">{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${percentage >= 75
                                                        ? "bg-red-500"
                                                        : percentage >= 50
                                                            ? "bg-yellow-500"
                                                            : "bg-green-500"
                                                    }`}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Breakdown */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-lg bg-green-50 p-2">
                                            <p className="text-muted-foreground">Available</p>
                                            <p className="text-lg font-semibold text-green-700">
                                                {balance.available.toFixed(1)}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-yellow-50 p-2">
                                            <p className="text-muted-foreground">Used</p>
                                            <p className="text-lg font-semibold text-yellow-700">
                                                {balance.used.toFixed(1)}
                                            </p>
                                        </div>
                                        {balance.carried > 0 && (
                                            <div className="rounded-lg bg-blue-50 p-2">
                                                <p className="text-muted-foreground">Carry Forward</p>
                                                <p className="text-lg font-semibold text-blue-700">
                                                    {balance.carried.toFixed(1)}
                                                </p>
                                            </div>
                                        )}
                                        {balance.accrued > 0 && (
                                            <div className="rounded-lg bg-purple-50 p-2">
                                                <p className="text-muted-foreground">Accrued</p>
                                                <p className="text-lg font-semibold text-purple-700">
                                                    {balance.accrued.toFixed(1)}
                                                </p>
                                            </div>
                                        )}
                                        {balance.lapsed > 0 && (
                                            <div className="rounded-lg bg-red-50 p-2">
                                                <p className="text-muted-foreground">Lapsed</p>
                                                <p className="text-lg font-semibold text-red-700">
                                                    {balance.lapsed.toFixed(1)}
                                                </p>
                                            </div>
                                        )}
                                        {balance.adjusted !== 0 && (
                                            <div
                                                className={`rounded-lg p-2 ${balance.adjusted > 0
                                                        ? "bg-green-50"
                                                        : "bg-red-50"
                                                    }`}
                                            >
                                                <p className="text-muted-foreground">Adjusted</p>
                                                <p
                                                    className={`text-lg font-semibold ${balance.adjusted > 0
                                                            ? "text-green-700"
                                                            : "text-red-700"
                                                        }`}
                                                >
                                                    {balance.adjusted > 0 ? "+" : ""}{balance.adjusted.toFixed(1)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Policy Info */}
                                    {balance.policy && (
                                        <div className="rounded-lg border-l-2 border-blue-200 bg-blue-50 p-2 text-sm">
                                            <p className="font-semibold text-blue-900 mb-1">Policy</p>
                                            <div className="text-blue-800 space-y-1">
                                                {balance.policy.maxDays && (
                                                    <p>Max Days: {balance.policy.maxDays}</p>
                                                )}
                                                {balance.policy.carryForwardCap && (
                                                    <p>Carry Forward Cap: {balance.policy.carryForwardCap}</p>
                                                )}
                                                {balance.policy.encashmentFlag && (
                                                    <p>Encashment: Allowed</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
