"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useAdminBalanceSummary,
    useAdminBalanceAlerts,
} from "@/lib/queries/leave";
import {
    Users,
    Calendar,
    TrendingUp,
    AlertTriangle,
    AlertCircle,
    Info,
} from "lucide-react";

export function LeaveDashboardTab() {
    const currentYear = new Date().getUTCFullYear();
    const {
        data: summary,
        isLoading: summaryLoading,
        error: summaryError,
    } = useAdminBalanceSummary(currentYear);
    const {
        data: alerts,
        isLoading: alertsLoading,
        error: alertsError,
    } = useAdminBalanceAlerts(currentYear);

    if (summaryLoading || alertsLoading) {
        return <DashboardSkeleton />;
    }

    if (summaryError || alertsError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Error Loading Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Failed to load dashboard data. Please try again later.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!summary || !alerts) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        No Data Available
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No leave balance data available for {currentYear}.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const metrics = [
        {
            title: "Total Employees",
            value: summary.overview.totalEmployees,
            icon: Users,
            color: "text-blue-600",
        },
        {
            title: "Days Allocated",
            value: summary.overview.totalDaysAllocated,
            icon: Calendar,
            color: "text-green-600",
        },
        {
            title: "Days Used",
            value: `${summary.overview.totalDaysUsed} (${summary.overview.overallUtilizationRate.toFixed(1)}%)`,
            icon: TrendingUp,
            color: "text-purple-600",
        },
        {
            title: "Total Alerts",
            value: `${alerts.summary.totalAlerts} (${alerts.summary.critical} critical)`,
            icon: AlertTriangle,
            color:
                alerts.summary.critical > 0
                    ? "text-red-600"
                    : alerts.summary.warnings > 0
                        ? "text-yellow-600"
                        : "text-gray-600",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <Card key={metric.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {metric.title}
                            </CardTitle>
                            <metric.icon className={`h-4 w-4 ${metric.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Alerts Section */}
            {alerts.summary.totalAlerts > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Active Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Critical Alerts */}
                        {alerts.alerts.negativeBalances.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="destructive">Critical</Badge>
                                    <span className="text-sm font-medium">
                                        Negative Balances ({alerts.alerts.negativeBalances.length})
                                    </span>
                                </div>
                                <div className="space-y-2 pl-4">
                                    {alerts.alerts.negativeBalances.slice(0, 5).map((alert) => (
                                        <div
                                            key={alert.employee.userId}
                                            className="rounded-lg border border-red-200 bg-red-50 p-3"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span>
                                                    <strong>{alert.employee.name}</strong> (
                                                    {alert.employee.employeeCode}) - {alert.leaveType.name}
                                                </span>
                                                <span className="font-semibold text-red-600">
                                                    {alert.balance} days
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {alerts.alerts.negativeBalances.length > 5 && (
                                        <p className="text-sm text-muted-foreground">
                                            + {alerts.alerts.negativeBalances.length - 5} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Warning Alerts */}
                        {alerts.alerts.highUsage.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        Warning
                                    </Badge>
                                    <span className="text-sm font-medium">
                                        High Usage ({alerts.alerts.highUsage.length})
                                    </span>
                                </div>
                                <div className="space-y-2 pl-4">
                                    {alerts.alerts.highUsage.slice(0, 3).map((alert) => (
                                        <div
                                            key={alert.employee.userId}
                                            className="rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span>
                                                    <strong>{alert.employee.name}</strong> -{" "}
                                                    {alert.leaveType.name}
                                                </span>
                                                <span className="font-semibold text-yellow-700">
                                                    {alert.usagePercent}% used
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {alerts.alerts.highUsage.length > 3 && (
                                        <p className="text-sm text-muted-foreground">
                                            + {alerts.alerts.highUsage.length - 3} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Approaching Limits */}
                        {alerts.alerts.approachingLimits.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">Info</Badge>
                                    <span className="text-sm font-medium">
                                        Approaching Limits ({alerts.alerts.approachingLimits.length})
                                    </span>
                                </div>
                                <div className="space-y-2 pl-4">
                                    {alerts.alerts.approachingLimits.slice(0, 3).map((alert, index) => (
                                        <div
                                            key={`${alert.employee.userId}-${alert.leaveType.id}-${index}`}
                                            className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span>
                                                    <strong>{alert.employee.name}</strong> -{" "}
                                                    {alert.leaveType.name}
                                                </span>
                                                <span className="font-semibold text-blue-700">
                                                    {alert.balance} days left
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {alerts.alerts.approachingLimits.length > 3 && (
                                        <p className="text-sm text-muted-foreground">
                                            + {alerts.alerts.approachingLimits.length - 3} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Unusual Adjustments */}
                        {alerts.alerts.unusualAdjustments.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">Info</Badge>
                                    <span className="text-sm font-medium">
                                        Unusual Adjustments ({alerts.alerts.unusualAdjustments.length})
                                    </span>
                                </div>
                                <div className="space-y-2 pl-4">
                                    {alerts.alerts.unusualAdjustments.slice(0, 3).map((alert) => (
                                        <div
                                            key={`${alert.employee.userId}-${alert.date}`}
                                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span>
                                                        <strong>{alert.employee.name}</strong> -{" "}
                                                        {alert.leaveType.name}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {(alert.adjustment ?? 0) > 0 ? "+" : ""}
                                                        {alert.adjustment ?? 0} days
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    By {alert.adjustedBy} • {alert.reason}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {alerts.alerts.unusualAdjustments.length > 3 && (
                                        <p className="text-sm text-muted-foreground">
                                            + {alerts.alerts.unusualAdjustments.length - 3} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Department Breakdown */}
            {summary.byDepartment.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Department Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {summary.byDepartment.map((dept) => (
                                <div key={dept.departmentId} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{dept.departmentName}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {dept.employeeCount} employees
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Allocated</p>
                                            <p className="font-semibold">{dept.allocated}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Used</p>
                                            <p className="font-semibold">{dept.used}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Available</p>
                                            <p className="font-semibold">{dept.available}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Utilization</p>
                                            <p className="font-semibold">
                                                {dept.utilizationRate.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leave Type Breakdown */}
            {summary.byLeaveType.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Leave Type Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {summary.byLeaveType.map((type) => (
                                <div key={type.leaveTypeId} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{type.leaveTypeName}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {type.employeeCount} employees
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Allocated</p>
                                            <p className="font-semibold">{type.allocated}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Used</p>
                                            <p className="font-semibold">{type.used}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Available</p>
                                            <p className="font-semibold">{type.available}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Utilization</p>
                                            <p className="font-semibold">
                                                {type.utilizationRate.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}
