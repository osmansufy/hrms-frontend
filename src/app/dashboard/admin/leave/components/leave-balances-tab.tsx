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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useAdminLeaveBalances,
    useExportBalances,
    downloadCSV,
} from "@/lib/queries/leave";
import {
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function LeaveBalancesTab() {
    const currentYear = new Date().getFullYear();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"low" | "normal" | "negative" | "">("");
    const [year, setYear] = useState(currentYear);

    const { data, isLoading, error } = useAdminLeaveBalances({
        page,
        pageSize,
        search: search || undefined,
        status: status || undefined,
        year,
    });

    const exportMutation = useExportBalances();

    const handleExport = async () => {
        try {
            toast.info("Preparing export...");
            const blob = await exportMutation.mutateAsync({
                year,
            });
            downloadCSV(blob, `leave_balances_${year}.csv`);
            toast.success("Export downloaded successfully");
        } catch (error) {
            toast.error("Failed to export balances");
            console.error(error);
        }
    };

    if (isLoading) {
        return <BalancesSkeleton />;
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Error Loading Balances
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Failed to load leave balances. Please try again later.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Balances Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No leave balances match your current filters.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters and Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-8"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value as typeof status);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Statuses</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="negative">Negative</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Year Filter */}
                            <Select
                                value={year.toString()}
                                onValueChange={(value) => {
                                    setYear(parseInt(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                                        <SelectItem key={y} value={y.toString()}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Export Button */}
                            <Button
                                onClick={handleExport}
                                disabled={exportMutation.isPending}
                                variant="outline"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {exportMutation.isPending ? "Exporting..." : "Export CSV"}
                            </Button>
                        </div>

                        {/* Statistics */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                <strong>{data.statistics.totalEmployees}</strong> employees
                            </span>
                            <span>•</span>
                            <span>
                                <strong>{data.statistics.negativeBalances}</strong> negative balances
                            </span>
                            <span>•</span>
                            <span>
                                <strong>{data.statistics.lowBalances}</strong> low balances
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Balances Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead className="text-right">Available</TableHead>
                                    <TableHead className="text-right">Used</TableHead>
                                    <TableHead className="text-right">Total Allocated</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((balance) => (
                                    <TableRow key={balance.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {balance.employee.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {balance.employee.email}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {balance.employee.department.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {balance.employee.employeeCode}
                                        </TableCell>
                                        <TableCell>{balance.leaveType.name}</TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-semibold text-base">
                                                {balance.balances.available}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {balance.balances.used}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {balance.balances.openingBalance +
                                                balance.balances.accrued +
                                                balance.balances.carried +
                                                balance.balances.adjusted}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    balance.status === "NEGATIVE"
                                                        ? "destructive"
                                                        : balance.status === "LOW"
                                                            ? "secondary"
                                                            : "default"
                                                }
                                                className={
                                                    balance.status === "LOW"
                                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                        : balance.status === "NORMAL"
                                                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                            : ""
                                                }
                                            >
                                                {balance.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/dashboard/admin/leave-balance?userId=${balance.userId}&leaveTypeId=${balance.leaveType.id}`}
                                            >
                                                <Button size="sm" variant="ghost">
                                                    Adjust
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
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

function BalancesSkeleton() {
    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
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
