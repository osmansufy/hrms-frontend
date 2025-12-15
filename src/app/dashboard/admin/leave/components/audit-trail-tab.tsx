"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAdminAdjustmentHistory } from "@/lib/queries/leave";
import {
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    FileText,
} from "lucide-react";

export function AuditTrailTab() {
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const { data, isLoading, error } = useAdminAdjustmentHistory({
        page,
        pageSize,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    if (isLoading) {
        return <AuditTrailSkeleton />;
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Error Loading Audit Trail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Failed to load adjustment history. Please try again later.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        No Adjustments Found
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No leave balance adjustments match your current filters.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Start Date
                            </label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">End Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Trail Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date/Time</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead className="text-right">Adjustment</TableHead>
                                    <TableHead className="text-right">Before</TableHead>
                                    <TableHead className="text-right">After</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Admin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((adjustment) => {
                                    const isPositive = adjustment.balances.change > 0;
                                    return (
                                        <TableRow key={adjustment.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {new Date(
                                                            adjustment.adjustment.effectiveDate
                                                        ).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            adjustment.adjustment.effectiveDate
                                                        ).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {adjustment.employee.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {adjustment.employee.employeeCode}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{adjustment.leaveType.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant={isPositive ? "default" : "destructive"}
                                                    className={
                                                        isPositive
                                                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                            : ""
                                                    }
                                                >
                                                    {isPositive ? "+" : ""}
                                                    {adjustment.balances.change}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {adjustment.balances.before}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {adjustment.balances.after}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <p
                                                        className="text-sm truncate"
                                                        title={adjustment.adjustment.reason}
                                                    >
                                                        {adjustment.adjustment.reason}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {adjustment.admin.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {adjustment.admin.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t px-6 py-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {(page - 1) * pageSize + 1} to{" "}
                            {Math.min(page * pageSize, data.pagination.totalCount)} of{" "}
                            {data.pagination.totalCount} results
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <div className="text-sm">
                                Page {page} of {data.pagination.totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= data.pagination.totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AuditTrailSkeleton() {
    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
